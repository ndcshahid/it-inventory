import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const transfers = await prisma.assetTransfer.findMany({
      include: {
        asset: { include: { category: true } },
        fromLocation: true,
        toLocation: true,
        transferredBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(transfers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
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
    const { assetId, fromLocationId, toLocationId, transferDate, receivedBy, remarks } = body;

    if (!assetId || !toLocationId || !transferDate) {
      return NextResponse.json({ error: 'Asset, destination location, and transfer date are required' }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    if (asset.status === 'ISSUED') {
      return NextResponse.json({ error: 'Cannot transfer an issued asset' }, { status: 400 });
    }

    const [transfer] = await prisma.$transaction([
      prisma.assetTransfer.create({
        data: {
          assetId,
          fromLocationId: fromLocationId || asset.locationId || null,
          toLocationId,
          transferredById: session.user.id,
          transferDate: new Date(transferDate),
          receivedBy,
          remarks,
        },
      }),
      prisma.asset.update({
        where: { id: assetId },
        data: { locationId: toLocationId, status: 'TRANSFERRED' },
      }),
    ]);

    const toLocation = await prisma.location.findUnique({ where: { id: toLocationId } });
    await prisma.activityLog.create({
      data: {
        actionType: 'ASSET_TRANSFERRED',
        description: `Asset "${asset.assetName}" transferred to ${toLocation?.name}`,
        userId: session.user.id,
        assetId,
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
