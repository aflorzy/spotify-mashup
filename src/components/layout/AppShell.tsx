// Implemented by: feature/pages-builder agent
import { Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
