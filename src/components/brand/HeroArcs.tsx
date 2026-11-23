export function HeroArcs({ width = 1440, height = 820, cx = width * 0.86, cy = 40, radii = [0.3, 0.5, 0.72] }: { width?: number; height?: number; cx?: number; cy?: number; radii?: number[] }) {
  const op = [0.45, 0.28, 0.16];
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMaxYMin slice" className="absolute inset-0 h-full w-full pointer-events-none">
      {radii.map((r, i) => (
        <circle key={r} cx={cx} cy={cy} r={Math.round(r * width)} fill="none" strokeWidth={1.5} style={{ stroke: 'var(--brand-sky)', strokeOpacity: op[i] }} />
      ))}
    </svg>
  );
}
