import { Outlet, useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import { useAppStore } from '../../store/useAppStore';

export default function AppShell() {
  const authError = useAppStore((s) => s.authError);
  const setAuthError = useAppStore((s) => s.setAuthError);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 overflow-x-hidden">
      <NavBar />
      {authError && (
        <div className="bg-red-900/80 border-b border-red-700 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-red-200 text-sm flex-1">{authError}</p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="text-white text-sm font-medium bg-red-700 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors"
              onClick={() => { setAuthError(null); navigate('/'); }}
            >
              Go to settings
            </button>
            <button
              onClick={() => setAuthError(null)}
              className="text-red-300 hover:text-white transition-colors text-lg leading-none"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
