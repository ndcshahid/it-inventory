import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const returns = await prisma.assetReturn.findMany({
      include: {
        asset: { include: { category: true } },
        issue: { include: { employee: true } },
        receivedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(returns);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
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
    const { issueId, returnDate, returnCondition, remarks } = body;

    if (!issueId || !returnDate) {
      return NextResponse.json({ error: 'Issue and return date are required' }, { status: 400 });
    }

    const issue = await prisma.assetIssue.findUnique({
      where: { id: issueId },
      include: { asset: true, employee: true },
    });
    if (!issue) return NextResponse.json({ error: 'Issue record not found' }, { status: 404 });
    if (!issue.isActive) return NextResponse.json({ error: 'Asset already returned' }, { status: 400 });

    // Determine new status based on return condition
    let newStatus: string = 'AVAILABLE';
    if (returnCondition === 'DAMAGED') newStatus = 'DAMAGED';
    else if (returnCondition === 'POOR') newStatus = 'UNDER_REPAIR';

    const [returnRecord] = await prisma.$transaction([
      prisma.assetReturn.create({
        data: {
          assetId: issue.assetId,
          issueId,
          receivedById: session.user.id,
          returnDate: new Date(returnDate),
          returnCondition: returnCondition || 'GOOD',
          remarks,
        },
      }),
      prisma.assetIssue.update({
        where: { id: issueId },
        data: { isActive: false },
      }),
      prisma.asset.update({
        where: { id: issue.assetId },
        data: { status: newStatus as any, condition: returnCondition || 'GOOD' },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        actionType: 'ASSET_RETURNED',
        description: `Asset "${issue.asset.assetName}" returned by ${issue.employee.name}`,
        userId: session.user.id,
        assetId: issue.assetId,
      },
    });

    return NextResponse.json(returnRecord, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process return' }, { status: 500 });
  }
}
