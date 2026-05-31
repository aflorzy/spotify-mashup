import { request } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.test' });

interface RefreshResult {
  accessToken: string;
  refreshToken: string; // Spotify may rotate the refresh token
  expiresIn: number;
}

async function refreshToken(refreshTok: string, clientId: string): Promise<RefreshResult> {
  const ctx = await request.newContext();
  const res = await ctx.post('https://accounts.spotify.com/api/token', {
    form: {
      grant_type: 'refresh_token',
      refresh_token: refreshTok,
      client_id: clientId,
    },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Token refresh failed (${res.status()}): ${body}`);
  }
  const data = await res.json() as {
    access_token: string;
    refresh_token?: string; // Spotify rotates refresh tokens
    expires_in: number;
  };
  await ctx.dispose();
  return {
    accessToken: data.access_token,
    // Use the new refresh token if Spotify returned one, otherwise keep the original
    refreshToken: data.refresh_token ?? refreshTok,
    expiresIn: data.expires_in,
  };
}

async function fetchDisplayName(accessToken: string): Promise<string> {
  const ctx = await request.newContext();
  const res = await ctx.get('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json() as { display_name?: string; id: string };
  await ctx.dispose();
  return data.display_name ?? data.id;
}

/**
 * Write updated tokens back to .env.test so subsequent runs use the rotated
 * refresh tokens (Spotify invalidates the previous refresh token on use).
 */
function updateEnvFile(updates: Record<string, string>): void {
  const envPath = path.resolve('.env.test');
  let content = fs.readFileSync(envPath, 'utf-8');
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    if (regex.test(content)) {
      content = content.replace(regex, line);
    } else {
      content = content.trimEnd() + '\n' + line + '\n';
    }
  }
  fs.writeFileSync(envPath, content, 'utf-8');
}

export default async function globalSetup() {
  const clientId = process.env.VITE_SPOTIFY_CLIENT_ID!;

  const [resultA, resultB] = await Promise.all([
    refreshToken(process.env.SPOTIFY_REFRESH_TOKEN_A!, clientId),
    refreshToken(process.env.SPOTIFY_REFRESH_TOKEN_B!, clientId),
  ]);

  const [nameA, nameB] = await Promise.all([
    fetchDisplayName(resultA.accessToken),
    fetchDisplayName(resultB.accessToken),
  ]);

  // Write rotated refresh tokens back to .env.test so future runs work
  updateEnvFile({
    SPOTIFY_ACCESS_TOKEN_A: resultA.accessToken,
    SPOTIFY_REFRESH_TOKEN_A: resultA.refreshToken,
    SPOTIFY_ACCESS_TOKEN_B: resultB.accessToken,
    SPOTIFY_REFRESH_TOKEN_B: resultB.refreshToken,
  });

  // Store fresh tokens + display names as env vars for worker processes to read
  process.env.SPOTIFY_FRESH_TOKEN_A = resultA.accessToken;
  process.env.SPOTIFY_FRESH_EXPIRES_A = String(Date.now() + resultA.expiresIn * 1000);
  process.env.SPOTIFY_DISPLAY_NAME_A = nameA;
  process.env.SPOTIFY_FRESH_TOKEN_B = resultB.accessToken;
  process.env.SPOTIFY_FRESH_EXPIRES_B = String(Date.now() + resultB.expiresIn * 1000);
  process.env.SPOTIFY_DISPLAY_NAME_B = nameB;

  console.log(`[globalSetup] Token A refreshed for: ${nameA}`);
  console.log(`[globalSetup] Token B refreshed for: ${nameB}`);
  console.log(`[globalSetup] Rotated tokens written back to .env.test`);
}
