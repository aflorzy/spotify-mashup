interface TrimHandleProps {
  position: number; // 0-1 fraction of container width
  color: 'green' | 'red';
  label: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const colorClasses = {
  green: {
    line: 'border-green-500',
    tab: 'bg-green-500 text-black',
  },
  red: {
    line: 'border-red-500',
    tab: 'bg-red-500 text-white',
  },
};

export default function TrimHandle({
  position,
  color,
  label,
  onMouseDown,
  onTouchStart,
  onKeyDown,
}: TrimHandleProps) {
  const colors = colorClasses[color];

  return (
    <div
      className="absolute top-0 bottom-0 flex flex-col items-center cursor-ew-resize select-none z-10 min-w-[44px] justify-start pt-1"
      style={{ left: `${position * 100}%`, transform: 'translateX(-50%)' }}
      tabIndex={0}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onKeyDown={onKeyDown}
      aria-label={`${color === 'green' ? 'Start' : 'End'} trim handle at ${label}`}
    >
      {/* Drag tab — min 44px tall touch target on mobile */}
      <div
        className={`${colors.tab} rounded px-2 py-1.5 text-xs font-mono font-semibold whitespace-nowrap shadow mb-0.5 select-none min-h-[32px] flex items-center justify-center min-w-[40px]`}
      >
        {label}
      </div>
      {/* Vertical line */}
      <div className={`flex-1 border-l-2 ${colors.line}`} style={{ minHeight: 0 }} />
    </div>
  );
}
