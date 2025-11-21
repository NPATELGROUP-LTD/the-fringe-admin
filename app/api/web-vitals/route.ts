import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, value, id, label } = await request.json();

    // Log web vitals for monitoring
    console.log(`Web Vital - ${name}:`, {
      value,
      id,
      label,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
    });

    // In production, you might want to:
    // 1. Store in database for analytics
    // 2. Send to monitoring service (DataDog, New Relic, etc.)
    // 3. Aggregate and analyze performance data

    return Response.json({ success: true });
  } catch (error) {
    console.error('Web vitals tracking error:', error);
    return Response.json({ error: 'Failed to track web vitals' }, { status: 500 });
  }
}