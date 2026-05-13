import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { username, email, name, password, role } = await req.json();
    if (!username || !name || !password || !role) {
      return NextResponse.json({ error: 'Username, name, password, and role are required' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email: email || null, name, password: hashed, role },
      select: { id: true, username: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
