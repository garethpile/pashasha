#!/usr/bin/env node

// Simple helper to mark a sandbox withdrawal as SUCCESSFUL in Eclipse.
// Usage:
//   ECLIPSE_API_BASE=... ECLIPSE_TENANT_ID=... ECLIPSE_CLIENT_ID=... ECLIPSE_CLIENT_SECRET=... \
//   node scripts/mark-withdrawal-success.js --walletId 2549317 --withdrawalId 347874 --status SUCCESSFUL

const args = require('minimist')(process.argv.slice(2));

const {
  walletId,
  withdrawalId,
  status = 'SUCCESSFUL',
  apiBase = process.env.ECLIPSE_API_BASE || 'https://sandbox.api.eftcorp.co.za',
  tenantId = process.env.ECLIPSE_TENANT_ID,
  clientId = process.env.ECLIPSE_CLIENT_ID,
  clientSecret = process.env.ECLIPSE_CLIENT_SECRET,
  tenantIdentity = process.env.ECLIPSE_TENANT_IDENTITY,
  tenantPassword = process.env.ECLIPSE_TENANT_PASSWORD,
} = args;

if (!walletId || !withdrawalId) {
  console.error(
    'Usage: node scripts/mark-withdrawal-success.js --walletId <id> --withdrawalId <id> [--status SUCCESSFUL]'
  );
  process.exit(1);
}

async function getToken() {
  // Prefer OAuth client credentials
  if (clientId && clientSecret) {
    const url = `${apiBase.replace(/\/$/, '')}/oauth/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.access_token;
  }

  if (!tenantIdentity || !tenantPassword) {
    throw new Error(
      'Missing credentials: set ECLIPSE_CLIENT_ID/SECRET or ECLIPSE_TENANT_IDENTITY/PASSWORD.'
    );
  }

  // Fallback: tenant identity/password (sandbox)
  const loginUrl = `${apiBase.replace(/\/$/, '')}/authentication/login`;
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: tenantIdentity, password: tenantPassword }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const bearer = data?.headerValue;
  if (!bearer) throw new Error('Missing headerValue in login response');
  return bearer.replace(/^Bearer\s+/i, '').trim();
}

async function markSuccess() {
  if (!tenantId) throw new Error('Missing ECLIPSE_TENANT_ID');
  const token = await getToken();
  const url = `${apiBase.replace(/\/$/, '')}/tenants/${tenantId}/wallets/${walletId}/withdrawals/${withdrawalId}`;
  const payload = { status };

  console.log(`PUT ${url} -> ${JSON.stringify(payload)}`);
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Update failed: ${res.status} ${text || res.statusText}`);
  }
  try {
    console.log('Success:', JSON.parse(text));
  } catch {
    console.log('Success:', text || '<empty>');
  }
}

markSuccess().catch((err) => {
  console.error(err);
  process.exit(1);
});
