import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForTokens, saveAccount, loadAccount } from '../services/spotify/auth';
import { getUserProfile } from '../services/spotify/api';
import { useAppStore } from '../store/useAppStore';
import type { PlayerAccount } from '../types/mix';
import Spinner from '../components/common/Spinner';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setAccountA, setAccountB, accountA } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const stateParam = params.get('state');
        if (!code || !stateParam) throw new Error('Missing code or state');

        const state = JSON.parse(stateParam) as { role: 'A' | 'B'; nonce: string };
        const verifier = sessionStorage.getItem(`mashup_verifier_${state.role}`);
        if (!verifier) throw new Error('Missing code verifier — please try logging in again');

        const tokens = await exchangeCodeForTokens(code, verifier);
        const profile = await getUserProfile(tokens.access_token);

        if (state.role === 'B') {
          const _existingA = accountA || loadAccount('A');
          // We need to check user ID — store it with account A
          const storedAId = sessionStorage.getItem('mashup_user_id_A');
          if (storedAId && storedAId === profile.id) {
            throw new Error('Player B must use a different Spotify account than Player A');
          }
        }

        const account: PlayerAccount = {
          role: state.role,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
          deviceId: null,
          displayName: profile.display_name,
        };

        if (state.role === 'A') {
          sessionStorage.setItem('mashup_user_id_A', profile.id);
          setAccountA(account);
        } else {
          setAccountB(account);
        }
        saveAccount(account);

        const returnTo = sessionStorage.getItem('mashup_auth_return') || '/';
        sessionStorage.removeItem('mashup_auth_return');
        navigate(returnTo, { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Authentication failed');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 max-w-md text-center">
          <h2 className="text-red-400 text-xl font-semibold mb-2">Authentication Failed</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="text-gray-400 mt-4">Connecting Spotify account…</p>
      </div>
    </div>
  );
}
