import { mesCorto } from "../lib/format";

/** Barras de radicaciones por semana (GET /paneles/empresa → por_semana). La última semana va resaltada. */
export default function BarChart({ data }: { data: { semana_inicio: string; total: number }[] }) {
  const W = 560, H = 210, pl = 30, pb = 26, pt = 14;
  const max = Math.max(4, ...data.map((x) => x.total));
  const bw = (W - pl - 10) / Math.max(1, data.length);
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / max);
  const ticks = [0, Math.round(max / 2), max];
  const resumen = data.map((d) => `semana del ${mesCorto(d.semana_inicio)}: ${d.total}`).join("; ");
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Radicaciones por semana. ${resumen}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={pl} x2={W - 6} y1={y(t)} y2={y(t)} strokeDasharray={t ? "3 4" : undefined} />
            <text x={pl - 8} y={y(t) + 4} textAnchor="end">{t}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const bx = pl + i * bw + bw * 0.18;
          const bh = H - pt - pb - (y(d.total) - pt);
          return (
            <g key={d.semana_inicio}>
              <rect className="bar" x={bx} y={y(d.total)} width={bw * 0.64} height={Math.max(0, bh)} rx={4} opacity={i === data.length - 1 ? 1 : 0.55}>
                <title>{`Semana del ${mesCorto(d.semana_inicio)}: ${d.total}`}</title>
              </rect>
              {d.total > 0 && <text x={bx + bw * 0.32} y={y(d.total) - 5} textAnchor="middle" style={{ fill: "var(--ink)", fontWeight: 700 }}>{d.total}</text>}
              <text x={bx + bw * 0.32} y={H - 8} textAnchor="middle">{mesCorto(d.semana_inicio)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
