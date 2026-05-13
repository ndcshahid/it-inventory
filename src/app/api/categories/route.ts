import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const categories = await prisma.category.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can manage categories' }, { status: 403 });
    }

    const { name, description } = await req.json();
    if (!name) return NextResponse.json({ error: 'Category name required' }, { status: 400 });

    const category = await prisma.category.create({ data: { name, description } });
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Category name already exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
