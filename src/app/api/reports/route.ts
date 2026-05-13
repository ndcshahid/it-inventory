import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const categoryId = searchParams.get('categoryId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59');

    let data: any = [];

    if (type === 'all' || type === 'available' || type === 'damaged') {
      const statusFilter: any = {};
      if (type === 'available') statusFilter.status = 'AVAILABLE';
      else if (type === 'damaged') statusFilter.status = 'DAMAGED';
      if (categoryId) statusFilter.categoryId = categoryId;
      if (Object.keys(dateFilter).length) statusFilter.createdAt = dateFilter;

      data = await prisma.asset.findMany({
        where: statusFilter,
        include: {
          category: true,
          location: true,
          issues: {
            where: { isActive: true },
            include: { employee: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (type === 'issued') {
      const where: any = { isActive: true };
      if (Object.keys(dateFilter).length) where.issueDate = dateFilter;

      data = await prisma.assetIssue.findMany({
        where,
        include: {
          asset: { include: { category: true } },
          employee: { include: { department: true } },
          issuedBy: { select: { name: true } },
        },
        orderBy: { issueDate: 'desc' },
      });
    } else if (type === 'transfers') {
      const where: any = {};
      if (Object.keys(dateFilter).length) where.transferDate = dateFilter;

      data = await prisma.assetTransfer.findMany({
        where,
        include: {
          asset: { include: { category: true } },
          fromLocation: true,
          toLocation: true,
          transferredBy: { select: { name: true } },
        },
        orderBy: { transferDate: 'desc' },
      });
    } else if (type === 'repairs') {
      data = await prisma.repairRecord.findMany({
        include: {
          asset: { include: { category: true, location: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (type === 'low-stock') {
      const categories = await prisma.category.findMany({
        include: {
          _count: { select: { assets: { where: { status: 'AVAILABLE' } } } },
        },
        where: { isActive: true },
      });
      data = categories.filter(c => c._count.assets < 3);
    }

    return NextResponse.json({ data, type });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
