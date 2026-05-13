import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const departments = await prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: 'Department name required' }, { status: 400 });

    const dept = await prisma.department.create({ data: { name, description } });
    return NextResponse.json(dept, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Department already exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
