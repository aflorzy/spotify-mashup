import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import AccountStatusBadge from '../components/common/AccountStatusBadge';
import Button from '../components/common/Button';
import { buildAuthUrl, generateCodeVerifier } from '../services/spotify/auth';

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

export default function HomePage() {
  const navigate = useNavigate();
  const accountA = useAppStore((s) => s.accountA);
  const accountB = useAppStore((s) => s.accountB);

  async function handleConnectSpotify() {
    const verifier = await generateCodeVerifier();
    const url = await buildAuthUrl('A', verifier);
    sessionStorage.setItem('mashup_auth_return', '/');
    window.location.href = url;
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

      {/* Account status strip */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center bg-gray-900 rounded-xl p-4 mb-10 border border-gray-800">
        <AccountStatusBadge account={accountA} label="Player A" />
        <div className="hidden sm:block w-px h-8 bg-gray-700" />
        <AccountStatusBadge account={accountB} label="Player B" />
        {!accountA && (
          <>
            <div className="hidden sm:block w-px h-8 bg-gray-700" />
            <Button size="sm" variant="primary" onClick={handleConnectSpotify}>
              Connect Spotify
            </Button>
          </>
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
