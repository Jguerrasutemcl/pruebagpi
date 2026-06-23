export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-56 rounded-lg bg-bg-secondary" />
        <div className="h-4 w-80 rounded-lg bg-bg-secondary mt-3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        <div className="h-[220px] rounded-xl bg-bg-secondary border border-border-primary" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-[220px] rounded-xl bg-bg-secondary border border-border-primary" />
          <div className="h-[220px] rounded-xl bg-bg-secondary border border-border-primary" />
          <div className="h-[220px] rounded-xl bg-bg-secondary border border-border-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="h-[360px] rounded-xl bg-bg-secondary border border-border-primary" />
        <div className="h-[360px] rounded-xl bg-bg-secondary border border-border-primary" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="h-[420px] rounded-xl bg-bg-secondary border border-border-primary" />
        <div className="space-y-4">
          <div className="h-[180px] rounded-xl bg-bg-secondary border border-border-primary" />
          <div className="h-[220px] rounded-xl bg-bg-secondary border border-border-primary" />
        </div>
      </div>
    </div>
  );
}