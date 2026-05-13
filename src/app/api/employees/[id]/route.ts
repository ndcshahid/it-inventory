import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        location: true,
        issuedAssets: {
          include: {
            asset: { include: { category: true } },
            issuedBy: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
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
    const { employeeId, name, email, phone, designation, departmentId, locationId, isActive } = body;

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        employeeId,
        name,
        email: email || null,
        phone: phone || null,
        designation: designation || null,
        departmentId: departmentId || null,
        locationId: locationId || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete employees' }, { status: 403 });
    }

    // Check for active issues
    const activeIssues = await prisma.assetIssue.count({
      where: { employeeId: params.id, isActive: true },
    });
    if (activeIssues > 0) {
      return NextResponse.json({ error: 'Cannot delete employee with active asset issues' }, { status: 400 });
    }

    await prisma.employee.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
