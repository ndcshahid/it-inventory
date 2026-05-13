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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          _count: { select: { issuedAssets: { where: { isActive: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({ employees, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
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
    const { employeeId, name, email, phone, designation, departmentId, locationId } = body;

    if (!employeeId || !name) {
      return NextResponse.json({ error: 'Employee ID and name are required' }, { status: 400 });
    }

    const existing = await prisma.employee.findFirst({
      where: { OR: [{ employeeId }, ...(email ? [{ email }] : [])] },
    });
    if (existing) {
      return NextResponse.json({ error: 'Employee ID or email already exists' }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name,
        email: email || null,
        phone: phone || null,
        designation: designation || null,
        departmentId: departmentId || null,
        locationId: locationId || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actionType: 'EMPLOYEE_CREATED',
        description: `Employee "${name}" (${employeeId}) added`,
        userId: session.user.id,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Employee ID or email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
