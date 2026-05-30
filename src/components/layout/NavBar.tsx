import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import AccountStatusBadge from '../common/AccountStatusBadge';

export default function NavBar() {
  const accountA = useAppStore((s) => s.accountA);
  const accountB = useAppStore((s) => s.accountB);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 h-14 flex items-center justify-between shrink-0">
      <Link
        to="/"
        className="text-xl font-bold tracking-tight text-white hover:text-green-400 transition-colors"
      >
        MashUp
      </Link>

      <div className="flex items-center gap-6">
        <AccountStatusBadge account={accountA} label="A" />
        <AccountStatusBadge account={accountB} label="B" />
      </div>
    </nav>
  );
}
