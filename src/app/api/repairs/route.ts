import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const repairs = await prisma.repairRecord.findMany({
      include: {
        asset: { include: { category: true, location: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(repairs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch repair records' }, { status: 500 });
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
    const { assetId, issueDescription, repairVendor, sentDate, expectedReturn, repairCost, remarks } = body;

    if (!assetId || !issueDescription || !sentDate) {
      return NextResponse.json({ error: 'Asset, issue description, and sent date are required' }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const [repair] = await prisma.$transaction([
      prisma.repairRecord.create({
        data: {
          assetId,
          issueDescription,
          repairVendor: repairVendor || null,
          sentDate: new Date(sentDate),
          expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
          repairCost: repairCost ? parseFloat(repairCost) : null,
          remarks,
          status: 'SENT_FOR_REPAIR',
        },
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: { status: 'UNDER_REPAIR' },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        actionType: 'ASSET_SENT_FOR_REPAIR',
        description: `Asset "${asset.assetName}" sent for repair`,
        userId: session.user.id,
        assetId,
      },
    });

    return NextResponse.json(repair, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create repair record' }, { status: 500 });
  }
}
