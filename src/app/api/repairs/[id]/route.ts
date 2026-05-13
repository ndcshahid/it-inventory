import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'IT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { status, repairCost, remarks, resolvedAssetStatus } = body;

    const repair = await prisma.repairRecord.update({
      where: { id: params.id },
      data: {
        status: status || undefined,
        repairCost: repairCost !== undefined ? parseFloat(repairCost) : undefined,
        remarks: remarks || undefined,
      },
      include: { asset: true },
    });

    // Update asset status if repair is resolved
    if ((status === 'REPAIRED' || status === 'NOT_REPAIRABLE') && resolvedAssetStatus) {
      await prisma.asset.update({
        where: { id: repair.assetId },
        data: { status: resolvedAssetStatus },
      });

      await prisma.activityLog.create({
        data: {
          actionType: 'ASSET_REPAIR_UPDATED',
          description: `Repair for "${repair.asset.assetName}" updated to ${status}`,
          userId: session.user.id,
          assetId: repair.assetId,
        },
      });
    }

    return NextResponse.json(repair);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update repair record' }, { status: 500 });
  }
}
