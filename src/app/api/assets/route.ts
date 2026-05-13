import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const locationId = searchParams.get('locationId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { assetName: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (locationId) where.locationId = locationId;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          issues: {
            where: { isActive: true },
            include: { employee: { select: { id: true, name: true } } },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({ assets, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
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
    const {
      assetName, assetTag, serialNumber, brand, model,
      purchaseDate, purchasePrice, warrantyExpiry, supplierName,
      condition, notes, categoryId, locationId,
    } = body;

    if (!assetName || !assetTag || !serialNumber) {
      return NextResponse.json({ error: 'Asset name, tag, and serial number are required' }, { status: 400 });
    }

    // Check uniqueness
    const existing = await prisma.asset.findFirst({
      where: { OR: [{ assetTag }, { serialNumber }] },
    });
    if (existing) {
      return NextResponse.json({ error: 'Asset tag or serial number already exists' }, { status: 400 });
    }

    const asset = await prisma.asset.create({
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
        condition: condition || 'GOOD',
        notes,
        categoryId: categoryId || null,
        locationId: locationId || null,
        status: 'AVAILABLE',
      },
    });

    await prisma.activityLog.create({
      data: {
        actionType: 'ASSET_CREATED',
        description: `Asset "${assetName}" (${assetTag}) added to inventory`,
        userId: session.user.id,
        assetId: asset.id,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Asset tag or serial number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
