import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        location: true,
        issues: {
          include: {
            employee: true,
            issuedBy: { select: { name: true } },
            returns: { include: { receivedBy: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        },
        transfers: {
          include: {
            fromLocation: true,
            toLocation: true,
            transferredBy: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        repairRecords: { orderBy: { createdAt: 'desc' } },
        activityLogs: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'IT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      assetName, assetTag, serialNumber, brand, model,
      purchaseDate, purchasePrice, warrantyExpiry, supplierName,
      condition, status, notes, categoryId, locationId,
    } = body;

    // Check uniqueness excluding current
    const existing = await prisma.asset.findFirst({
      where: {
        OR: [{ assetTag }, { serialNumber }],
        NOT: { id: params.id },
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Asset tag or serial number already exists' }, { status: 400 });
    }

    const asset = await prisma.asset.update({
      where: { id: params.id },
      data: {
        assetName,
        assetTag,
        serialNumber,
        brand,
        model,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        supplierName,
        condition,
        status,
        notes,
        categoryId: categoryId || null,
        locationId: locationId || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actionType: 'ASSET_UPDATED',
        description: `Asset "${asset.assetName}" (${asset.assetTag}) updated`,
        userId: session.user.id,
        assetId: asset.id,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete assets' }, { status: 403 });
    }

    const asset = await prisma.asset.findUnique({ where: { id: params.id } });
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    // Delete related records
    await prisma.activityLog.deleteMany({ where: { assetId: params.id } });
    await prisma.repairRecord.deleteMany({ where: { assetId: params.id } });
    await prisma.assetTransfer.deleteMany({ where: { assetId: params.id } });
    await prisma.assetReturn.deleteMany({ where: { assetId: params.id } });
    await prisma.assetIssue.deleteMany({ where: { assetId: params.id } });
    await prisma.asset.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}
