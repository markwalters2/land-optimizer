import { NextRequest, NextResponse } from 'next/server';

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID!;
const CF_API_KEY    = process.env.CF_API_KEY!;
const CF_API_EMAIL  = process.env.CF_API_EMAIL!;
const CF_KV_NS_ID   = process.env.CF_KV_NS_ID!;
const LEADS_SECRET  = process.env.LEADS_SECRET!;

async function listKVKeys(prefix: string): Promise<string[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NS_ID}/keys?prefix=${encodeURIComponent(prefix)}&limit=1000`;
  const res = await fetch(url, {
    headers: { 'X-Auth-Email': CF_API_EMAIL, 'X-Auth-Key': CF_API_KEY },
  });
  const data = await res.json() as { result?: { name: string }[]; success: boolean };
  return data.result?.map(k => k.name) ?? [];
}

async function getKVValue(key: string): Promise<string | null> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NS_ID}/values/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { 'X-Auth-Email': CF_API_EMAIL, 'X-Auth-Key': CF_API_KEY },
  });
  if (!res.ok) return null;
  return res.text();
}

export async function GET(request: NextRequest) {
  // Simple secret check — pass ?secret=... in URL
  const secret = request.nextUrl.searchParams.get('secret');
  if (!LEADS_SECRET || secret !== LEADS_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get('format') ?? 'json';

  const keys = await listKVKeys('lead:');
  const leads = await Promise.all(
    keys.map(async (key) => {
      const val = await getKVValue(key);
      try { return val ? JSON.parse(val) : null; } catch { return null; }
    })
  );
  const validLeads = leads.filter(Boolean).sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  );

  if (format === 'csv') {
    const header = 'email,facilityType,budget,fieldCount,totalArea,address,capturedAt,ip';
    const rows = validLeads.map(l =>
      [l.email, l.facilityType, l.budget, l.fieldCount, l.totalArea, l.address, l.capturedAt, l.ip]
        .map(v => `"${v ?? ''}"`)
        .join(',')
    );
    return new NextResponse([header, ...rows].join('\n'), {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="leads.csv"' },
    });
  }

  return NextResponse.json({
    total: validLeads.length,
    leads: validLeads,
  });
}
