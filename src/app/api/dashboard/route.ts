import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [
      totalAssets,
      availableAssets,
      issuedAssets,
      damagedAssets,
      underRepairAssets,
      transferredAssets,
      categoryStats,
      recentLogs,
      lowStockCategories,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { status: 'ISSUED' } }),
      prisma.asset.count({ where: { status: 'DAMAGED' } }),
      prisma.asset.count({ where: { status: 'UNDER_REPAIR' } }),
      prisma.asset.count({ where: { status: 'TRANSFERRED' } }),
      prisma.asset.groupBy({
        by: ['categoryId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } }, asset: { select: { assetName: true } } },
      }),
      prisma.category.findMany({
        include: {
          _count: { select: { assets: { where: { status: 'AVAILABLE' } } } },
        },
        where: { isActive: true },
      }),
    ]);

    // Get category names for stats
    const categoryIds = categoryStats.map(c => c.categoryId).filter(Boolean) as string[];
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryChartData = categoryStats.map(stat => {
      const cat = categories.find(c => c.id === stat.categoryId);
      return { name: cat?.name || 'Uncategorized', count: stat._count.id };
    });

    return NextResponse.json({
      stats: {
        totalAssets,
        availableAssets,
        issuedAssets,
        damagedAssets,
        underRepairAssets,
        transferredAssets,
        lowStockCount: lowStockCategories.filter(c => c._count.assets < 2).length,
      },
      categoryChartData,
      recentActivity: recentLogs,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
