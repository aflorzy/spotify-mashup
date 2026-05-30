// PKCE OAuth helpers, token storage, and refresh logic.
// Implemented by: feature/services agent
import type { PlayerAccount } from '../../types/mix';

export const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
export const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string;

export const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ');

export async function generateCodeVerifier(): Promise<string> {
  throw new Error('Not implemented');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  throw new Error(`Not implemented: ${verifier}`);
}

export function buildAuthUrl(role: 'A' | 'B', verifier: string): string {
  throw new Error(`Not implemented: ${role} ${verifier}`);
}

export async function exchangeCodeForTokens(code: string, verifier: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  throw new Error(`Not implemented: ${code} ${verifier}`);
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  throw new Error(`Not implemented: ${refreshToken}`);
}

export async function getValidToken(account: PlayerAccount): Promise<string> {
  throw new Error(`Not implemented: ${account.role}`);
}

export function saveAccount(account: PlayerAccount): void {
  throw new Error(`Not implemented: ${account.role}`);
}

export function loadAccount(role: 'A' | 'B'): PlayerAccount | null {
  throw new Error(`Not implemented: ${role}`);
}

export function clearAccount(role: 'A' | 'B'): void {
  throw new Error(`Not implemented: ${role}`);
}
