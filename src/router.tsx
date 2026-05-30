import { HashRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import AuthCallback from './pages/AuthCallback';
import MixBuilderPage from './pages/MixBuilderPage';
import MixEditorPage from './pages/MixEditorPage';
import PlaybackPage from './pages/PlaybackPage';
import MixListPage from './pages/MixListPage';

export default function Router() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/mix/:id/play" element={<PlaybackPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/mix/new" element={<MixBuilderPage />} />
          <Route path="/mix/:id/edit" element={<MixEditorPage />} />
          <Route path="/mixes" element={<MixListPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
