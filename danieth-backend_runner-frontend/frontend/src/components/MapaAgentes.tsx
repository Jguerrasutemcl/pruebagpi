// Mapa visual de los agentes del orquestador. El agente "activo ahora" se
// deriva del campo `agente` del último evento de la timeline (no requiere nada
// nuevo del backend). El agente activo se ilumina con un pulso.

interface AgenteDef {
  id: string; // debe coincidir con el campo `agente` de los eventos
  nombre: string;
  icono: string;
  color: string;
  implementado: boolean; // false = aún no emite eventos (ej. el Explotador)
}

// Orden = flujo de una iteración de la campaña.
const AGENTES: AgenteDef[] = [
  { id: 'commander', nombre: 'Commander', icono: '🛰️', color: 'var(--accent-cyan)', implementado: true },
  { id: 'selector', nombre: 'Selector', icono: '🎯', color: 'var(--accent-blue)', implementado: true },
  { id: 'explorer', nombre: 'Explorador', icono: '🔍', color: 'var(--accent-blue)', implementado: true },
  { id: 'exploiter', nombre: 'Explotador', icono: '💥', color: 'var(--severity-high)', implementado: false },
  { id: 'judge', nombre: 'Juez', icono: '⚖️', color: 'var(--severity-medium)', implementado: true },
  { id: 'summarizer', nombre: 'Resumidor', icono: '🧠', color: 'var(--severity-low)', implementado: true },
];

function NodoAgente({ agente, activo }: { agente: AgenteDef; activo: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: '88px' }}>
      <div
        className={`flex items-center justify-center rounded-xl transition-all ${activo ? 'animate-agent-glow' : ''}`}
        style={{
          width: '56px',
          height: '56px',
          fontSize: '26px',
          background: activo ? 'rgba(0,212,255,0.12)' : 'var(--bg-tertiary)',
          border: `1px solid ${activo ? 'var(--accent-cyan)' : 'var(--border-primary)'}`,
          opacity: agente.implementado || activo ? 1 : 0.4,
          filter: agente.implementado || activo ? 'none' : 'grayscale(1)',
        }}
      >
        {agente.icono}
      </div>
      <span
        className="text-[11px] font-bold text-center leading-tight"
        style={{ color: activo ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}
      >
        {agente.nombre}
      </span>
      {!agente.implementado && (
        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
          pronto
        </span>
      )}
    </div>
  );
}

export default function MapaAgentes({ agenteActivo }: { agenteActivo: string | null }) {
  return (
    <div className="p-6 rounded-xl border flex flex-col gap-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          🧩 Agentes del orquestador
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {agenteActivo
            ? <>activo: <span className="font-bold" style={{ color: 'var(--accent-cyan)' }}>{agenteActivo}</span></>
            : 'en reposo'}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1 overflow-x-auto py-2">
        {AGENTES.map((agente, i) => (
          <div key={agente.id} className="flex items-center gap-1">
            <NodoAgente agente={agente} activo={agente.id === agenteActivo} />
            {i < AGENTES.length - 1 && (
              <span className="text-lg shrink-0" style={{ color: 'var(--border-primary)' }}>→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
