import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import AccountStatusBadge from '../common/AccountStatusBadge';

export default function NavBar() {
  const accountA = useAppStore((s) => s.accountA);
  const accountB = useAppStore((s) => s.accountB);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 h-14 flex items-center justify-between shrink-0">
      <div className="flex items-center">
        <Link
          to="/"
          className="text-xl font-bold tracking-tight text-white hover:text-green-400 transition-colors"
        >
          MashUp
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 ml-4">
          <Link
            to="/mixes"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Mixes
          </Link>
          <Link
            to="/mix/new"
            className="text-gray-400 hover:text-white text-sm transition-colors hidden sm:block"
          >
            + New
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <AccountStatusBadge account={accountA} label="A" />
        <AccountStatusBadge account={accountB} label="B" />
      </div>
    </nav>
  );
}
