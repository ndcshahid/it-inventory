import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (activeOnly) where.isActive = true;
    if (search) {
      where.OR = [
        { asset: { assetName: { contains: search, mode: 'insensitive' } } },
        { employee: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [issues, total] = await Promise.all([
      prisma.assetIssue.findMany({
        where,
        include: {
          asset: { include: { category: true } },
          employee: true,
          issuedBy: { select: { name: true } },
          returns: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.assetIssue.count({ where }),
    ]);

    return NextResponse.json({ issues, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch issues' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'IT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { assetId, employeeId, issueDate, expectedReturnDate, remarks, documentLink } = body;

    if (!assetId || !employeeId || !issueDate) {
      return NextResponse.json({ error: 'Asset, employee, and issue date are required' }, { status: 400 });
    }

    // Check asset is available
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    if (asset.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Asset is not available for issuance' }, { status: 400 });
    }

    // Create issue record and update asset status
    const [issue] = await prisma.$transaction([
      prisma.assetIssue.create({
        data: {
          assetId,
          employeeId,
          issuedById: session.user.id,
          issueDate: new Date(issueDate),
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          remarks,
          documentLink: documentLink || null,
          isActive: true,
        },
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: { status: 'ISSUED' },
      }),
    ]);

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    await prisma.activityLog.create({
      data: {
        actionType: 'ASSET_ISSUED',
        description: `Asset "${asset.assetName}" issued to ${employee?.name}`,
        userId: session.user.id,
        assetId,
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to issue asset' }, { status: 500 });
  }
}
