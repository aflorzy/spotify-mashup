import type { PlayerAccount } from '../../types/mix';
import { useAppStore } from '../../store/useAppStore';

export const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
export const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string;
export const SCOPES = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state playlist-read-private playlist-read-collaborative';
// Bump this when the required scope list grows so existing sessions re-authorize.
export const REQUIRED_SCOPES_VERSION = 3;

export async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(96);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function buildAuthUrl(role: 'A' | 'B', verifier: string, popup = false, forceDialog = false): Promise<string> {
  const challenge = await generateCodeChallenge(verifier);
  const nonce = crypto.randomUUID();
  const state = JSON.stringify({ role, nonce, ...(popup && { popup: true }) });
  sessionStorage.setItem(`mashup_verifier_${role}`, verifier);
  sessionStorage.setItem(`mashup_state_${role}`, state);
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    ...((role === 'B' || forceDialog) && { show_dialog: 'true' }),
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForTokens(code: string, verifier: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID,
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return res.json();
}

export async function getValidToken(account: PlayerAccount): Promise<string> {
  if (account.expiresAt - Date.now() < 60000) {
    let access_token: string;
    let expires_in: number;
    try {
      ({ access_token, expires_in } = await refreshAccessToken(account.refreshToken));
    } catch (e) {
      useAppStore.getState().setAuthError(
        'Reconnect your Spotify account — authorization expired or revoked.'
      );
      throw e;
    }
    const updated: PlayerAccount = {
      ...account,
      accessToken: access_token,
      expiresAt: Date.now() + expires_in * 1000,
    };
    saveAccount(updated);
    const { setAccountA, setAccountB } = useAppStore.getState();
    if (account.role === 'A') setAccountA(updated);
    else setAccountB(updated);
    return access_token;
  }
  return account.accessToken;
}

export function saveAccount(account: PlayerAccount): void {
  sessionStorage.setItem(
    `mashup_account_${account.role}`,
    JSON.stringify(account),
  );
}

export function loadAccount(role: 'A' | 'B'): PlayerAccount | null {
  const raw = sessionStorage.getItem(`mashup_account_${role}`);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearAccount(role: 'A' | 'B'): void {
  sessionStorage.removeItem(`mashup_account_${role}`);
  sessionStorage.removeItem(`mashup_verifier_${role}`);
  sessionStorage.removeItem(`mashup_state_${role}`);
}
