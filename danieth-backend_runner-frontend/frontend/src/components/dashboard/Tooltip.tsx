import type { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom';
  align?: 'left' | 'center' | 'right';
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  align = 'center',
}: TooltipProps) {
  const positionClasses =
    position === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-2';

  const alignClasses =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div className="relative inline-block group">
      {children}

      <div
        className={`
          pointer-events-none absolute z-50 min-w-max max-w-[260px]
          opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
          group-focus-within:opacity-100 group-focus-within:scale-100
          transition-all duration-150
          ${positionClasses} ${alignClasses}
        `}
      >
        <div
          className="rounded-lg px-3 py-2 text-xs leading-relaxed shadow-lg border"
          style={{
            background: 'rgba(15, 23, 42, 0.96)',
            color: 'white',
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}