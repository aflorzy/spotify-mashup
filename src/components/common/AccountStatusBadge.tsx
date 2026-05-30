import type { PlayerAccount } from '../../types/mix';

interface Props {
  account: PlayerAccount | null;
  label: string;
}

export default function AccountStatusBadge({ account, label }: Props) {
  let dotColor: string;
  let statusText: string;

  if (!account) {
    dotColor = 'bg-gray-500';
    statusText = 'Not connected';
  } else if (account.deviceId !== null) {
    dotColor = 'bg-green-400';
    statusText = account.displayName;
  } else {
    dotColor = 'bg-yellow-400';
    statusText = `${account.displayName} (connecting…)`;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${dotColor} shrink-0`} />
        <span className="text-sm text-gray-300 truncate max-w-[120px]">{statusText}</span>
      </div>
    </div>
  );
}
