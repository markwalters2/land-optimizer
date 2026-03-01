import { NextRequest, NextResponse } from 'next/server';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID!;
const CF_API_KEY    = process.env.CF_API_KEY!;
const CF_API_EMAIL  = process.env.CF_API_EMAIL!;
const CF_KV_NS_ID   = process.env.CF_KV_NS_ID!;

interface LeadPayload {
  email: string;
  facilityType?: string;
  budget?: number;
  fieldCount?: number;
  totalArea?: number;
  address?: string;
  source: 'save-plan';
}

async function writeToKV(key: string, value: string): Promise<boolean> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NS_ID}/values/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-Auth-Email': CF_API_EMAIL,
      'X-Auth-Key': CF_API_KEY,
      'Content-Type': 'text/plain',
    },
    body: value,
  });
  return res.ok;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LeadPayload;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!body.email || !emailRegex.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const timestamp = Date.now();
    const key = `lead:${timestamp}`;
    const lead = {
      email: body.email,
      facilityType: body.facilityType ?? 'unknown',
      budget: body.budget ?? null,
      fieldCount: body.fieldCount ?? null,
      totalArea: body.totalArea ?? null,
      address: body.address ?? null,
      source: 'save-plan',
      ip: request.headers.get('x-forwarded-for') ?? 'unknown',
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      capturedAt: new Date(timestamp).toISOString(),
    };

    const ok = await writeToKV(key, JSON.stringify(lead));

    if (!ok) {
      console.error('KV write failed for lead:', lead.email);
      // Still return success to the user — don't punish them for our infra issues
      return NextResponse.json({ success: true, stored: false });
    }

    console.log(`Lead captured: ${lead.email} — ${lead.facilityType}, budget $${lead.budget}`);
    return NextResponse.json({ success: true, stored: true });

  } catch (err) {
    console.error('capture-lead error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
