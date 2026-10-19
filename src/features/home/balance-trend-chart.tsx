import type { BalancePoint } from "@/domain/movements";

const WIDTH = 300;
const HEIGHT = 64;
const PAD = 4;

export function BalanceTrendChart({ points }: { points: BalancePoint[] }) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.balance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * WIDTH;
    const y = PAD + (1 - (p.balance - min) / range) * (HEIGHT - PAD * 2);
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as const;
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${HEIGHT} ${line} ${WIDTH},${HEIGHT}`;
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="h-16 w-full overflow-visible"
      role="img"
      aria-label="Evolución de tu saldo en los últimos 30 días"
    >
      <polygon points={area} className="fill-lime-300/10" />
      <polyline points={line} fill="none" className="stroke-lime-300" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3.5" className="fill-lime-300" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
