import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
