import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function getInventoryContext() {
  const [
    totalAssets,
    assetsByStatus,
    assetsByCondition,
    activeIssues,
    pendingRepairs,
    recentActivity,
    topCategories,
    totalEmployees,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.groupBy({ by: ['status'], _count: true }),
    prisma.asset.groupBy({ by: ['condition'], _count: true }),
    prisma.assetIssue.count({ where: { isActive: true } }),
    prisma.repairRecord.count({ where: { status: { in: ['SENT_FOR_REPAIR', 'IN_PROGRESS'] } } }),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { actionType: true, description: true, createdAt: true },
    }),
    prisma.category.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { assets: { _count: 'desc' } },
      take: 5,
    }),
    prisma.employee.count({ where: { isActive: true } }),
  ]);

  const statusSummary = assetsByStatus.map(s => `${s.status}: ${s._count}`).join(', ');
  const conditionSummary = assetsByCondition.map(c => `${c.condition}: ${c._count}`).join(', ');
  const categorySummary = topCategories.map(c => `${c.name} (${c._count.assets})`).join(', ');
  const activitySummary = recentActivity
    .map(a => `[${new Date(a.createdAt).toLocaleDateString()}] ${a.description}`)
    .join('\n');

  return `
IT Inventory System — Live Stats (as of ${new Date().toLocaleString()}):
- Total Assets: ${totalAssets}
- Assets by Status: ${statusSummary}
- Assets by Condition: ${conditionSummary}
- Currently Issued Assets: ${activeIssues}
- Pending/In-Progress Repairs: ${pendingRepairs}
- Active Employees: ${totalEmployees}
- Top Categories: ${categorySummary}
- Recent Activity:
${activitySummary}
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: 'No messages provided' }, { status: 400 });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });

    const inventoryContext = await getInventoryContext();

    const systemPrompt = `You are an AI assistant for an IT Asset Inventory Management System. You help IT managers and staff quickly understand the state of their asset inventory, answer questions about assets, employees, and issues, and provide actionable insights.

Be concise, friendly, and professional. Format numbers clearly. Use bullet points for lists. If asked about something outside inventory management, politely redirect the conversation.

Here is the current live inventory data you have access to:

${inventoryContext}`;

    // Strip leading assistant messages (UI greeting) so history starts with a user turn
    const firstUserIdx = messages.findIndex((m: any) => m.role === 'user');
    if (firstUserIdx === -1) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }
    const conversation = messages.slice(firstUserIdx);

    // Map to OpenAI-compatible format (assistant role stays as-is)
    const conversationHistory = conversation.slice(0, -1).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const lastMessage = conversation[conversation.length - 1];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        transforms: ['middle-out'],
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: lastMessage.content },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter error:', data);
      return NextResponse.json({ error: data.error?.message || 'OpenRouter request failed' }, { status: response.status });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) return NextResponse.json({ error: 'Empty response from model' }, { status: 500 });

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error?.message ?? error);
    return NextResponse.json({ error: error?.message || 'Failed to get response' }, { status: 500 });
  }
}
