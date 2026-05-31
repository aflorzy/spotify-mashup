import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import AuthCallback from './pages/AuthCallback';
import MixBuilderPage from './pages/MixBuilderPage';
import MixEditorPage from './pages/MixEditorPage';
import PlaybackPage from './pages/PlaybackPage';
import MixListPage from './pages/MixListPage';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/mix/:id/play" element={<ErrorBoundary><PlaybackPage /></ErrorBoundary>} />
        <Route element={<AppShell />}>
          <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="/mix/new" element={<ErrorBoundary><MixBuilderPage /></ErrorBoundary>} />
          <Route path="/mix/:id/edit" element={<ErrorBoundary><MixEditorPage /></ErrorBoundary>} />
          <Route path="/mixes" element={<ErrorBoundary><MixListPage /></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
