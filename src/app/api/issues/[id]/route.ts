import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'IT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const { issueDate, expectedReturnDate, remarks, documentLink } = await req.json();

    if (!issueDate) {
      return NextResponse.json({ error: 'Issue date is required' }, { status: 400 });
    }

    const existing = await prisma.assetIssue.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Issue record not found' }, { status: 404 });

    const updated = await prisma.assetIssue.update({
      where: { id },
      data: {
        issueDate: new Date(issueDate),
        expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
        remarks: remarks || null,
        documentLink: documentLink || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update issue' }, { status: 500 });
  }
}
