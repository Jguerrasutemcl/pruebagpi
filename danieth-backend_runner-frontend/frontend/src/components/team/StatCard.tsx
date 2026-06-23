// src/components/team/StatCard.tsx
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  valueColor?: string;
}

export default function StatCard({
  label,
  value,
  sub,
  valueColor = 'text-text-primary',
}: StatCardProps) {
  return (
    <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 flex flex-col gap-1 min-w-0">
      <span className="text-[10px] uppercase tracking-widest text-text-muted font-semibold truncate">
        {label}
      </span>
      <span className={`text-3xl font-bold leading-tight ${valueColor}`}>
        {value}
      </span>
      {sub && (
        <span className="text-xs text-text-muted truncate">{sub}</span>
      )}
    </div>
  );
}