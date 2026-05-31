import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import Button from '../components/common/Button';
import { buildAuthUrl, generateCodeVerifier, clearAccount } from '../services/spotify/auth';
import type { PlayerAccount } from '../types/mix';

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Build your playlist',
    desc: 'Search Spotify or import your existing playlists. Arrange tracks in the order you want them played.',
  },
  {
    step: '02',
    title: 'Trim & crossfade',
    desc: 'Set precise start/end timestamps for each track and dial in crossfade durations between songs.',
  },
  {
    step: '03',
    title: 'Play at your event',
    desc: 'Hit play and walk away. MashUp handles the automated crossfades — no DJ required.',
  },
];

interface AccountCardProps {
  role: 'A' | 'B';
  account: PlayerAccount | null;
  description: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

function AccountCard({ role, account, description, onConnect, onDisconnect }: AccountCardProps) {
  const isConnected = account !== null;
  const isReady = account?.deviceId !== null;

  let dotColor: string;
  let statusText: string;

  if (!account) {
    dotColor = 'bg-gray-600';
    statusText = 'Not connected';
  } else if (isReady) {
    dotColor = 'bg-green-400';
    statusText = account.displayName;
  } else {
    dotColor = 'bg-yellow-400';
    statusText = `${account.displayName} (connecting…)`;
  }

  return (
    <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono font-bold text-green-400 shrink-0">
            Player {role}
          </span>
          <span className="text-gray-600 text-xs shrink-0">·</span>
          <span className="text-gray-500 text-xs truncate">{description}</span>
        </div>
        <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${dotColor}`} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-300 truncate">{statusText}</span>
        {isConnected ? (
          <Button size="sm" variant="ghost" onClick={onDisconnect} className="shrink-0 text-xs">
            Disconnect
          </Button>
        ) : (
          <Button size="sm" variant="primary" onClick={onConnect} className="shrink-0 text-xs">
            Connect Spotify
          </Button>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const accountA = useAppStore((s) => s.accountA);
  const accountB = useAppStore((s) => s.accountB);
  const setAccountA = useAppStore((s) => s.setAccountA);
  const setAccountB = useAppStore((s) => s.setAccountB);
  const authError = useAppStore((s) => s.authError);

  async function handleConnectA() {
    const verifier = await generateCodeVerifier();
    const url = await buildAuthUrl('A', verifier, false, !!authError);
    sessionStorage.setItem('mashup_auth_return', '/');
    window.location.href = url;
  }

  async function handleConnectB() {
    const verifier = await generateCodeVerifier();
    // popup: false since we redirect; show_dialog is already set in buildAuthUrl for role B
    const url = await buildAuthUrl('B', verifier, false, !!authError);
    sessionStorage.setItem('mashup_auth_return', '/');
    window.location.href = url;
  }

  function handleDisconnectA() {
    clearAccount('A');
    setAccountA(null);
  }

  function handleDisconnectB() {
    clearAccount('B');
    setAccountB(null);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-extrabold text-white tracking-tight mb-4">
          Mash<span className="text-green-400">Up</span>
        </h1>
        <p className="text-xl text-gray-400 leading-relaxed">
          Build your perfect event playlist. No DJ required.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
        <Button size="lg" variant="primary" onClick={() => navigate('/mix/new')}>
          Create new mix
        </Button>
        <Button size="lg" variant="secondary" onClick={() => navigate('/mixes')}>
          Open saved mix
        </Button>
      </div>

      {/* Account connection strip */}
      <div className="mb-10">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest text-center mb-3">
          Spotify Accounts
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <AccountCard
            role="A"
            account={accountA}
            description="Search &amp; build mixes"
            onConnect={handleConnectA}
            onDisconnect={handleDisconnectA}
          />
          <AccountCard
            role="B"
            account={accountB}
            description="Crossfade playback"
            onConnect={handleConnectB}
            onDisconnect={handleDisconnectB}
          />
        </div>
        {!accountA && (
          <p className="text-gray-600 text-xs text-center mt-2">
            Connect Account A to search tracks and build mixes. Account B is needed for crossfade playback.
          </p>
        )}
        {accountA && !accountB && (
          <p className="text-gray-600 text-xs text-center mt-2">
            Connect Account B (a second Spotify account) to enable crossfade playback.
          </p>
        )}
      </div>

      {/* How it works */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest text-center mb-6">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(({ step, title, desc }) => (
            <div
              key={step}
              className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col gap-2"
            >
              <span className="text-xs font-mono font-bold text-green-400">{step}</span>
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
