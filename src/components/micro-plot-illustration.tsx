import { cn } from "@/lib/cn";

const PLOTS = [
  { id: "A", x: 132, y: 12, w: 168, h: 196, fill: "#0F5A3E", label: "Garlic", acres: "0.50" },
  { id: "B", x: 304, y: 12, w: 184, h: 178, fill: "#7FA874", label: "Vegetables", acres: "0.50", dark: true },
  { id: "C", x: 132, y: 212, w: 168, h: 96, fill: "#D8AA62", label: "Herbs", acres: "0.25", dark: true },
  { id: "D", x: 304, y: 194, w: 184, h: 114, fill: "#3F7F7A", label: "Community", acres: "0.25" },
];

/** Static, illustrative diagram for marketing. The live, computed version lives in the optimizer. */
export function MicroPlotIllustration({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 500 340" className={cn("h-auto w-full", className)} role="img" aria-label="Illustrative two-acre property divided into four plots and a shared yard">
      <defs>
        <pattern id="ill-furrows" width="10" height="10" patternUnits="userSpaceOnUse">
          <line x1="0" y1="5" x2="10" y2="5" stroke="white" strokeOpacity="0.12" strokeWidth="2" />
        </pattern>
      </defs>
      <rect x="4" y="4" width="492" height="332" rx="22" fill="#F3F1E6" stroke="#04291E" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="12" y="12" width="116" height="296" rx="12" fill="#EFE7D3" />
      <rect x="44" y="70" width="52" height="34" rx="4" fill="#C9B68C" />
      <path d="M 38 72 L 70 52 L 102 72 Z" fill="#9A6F2C" />
      <text x="70" y="132" textAnchor="middle" fontSize="13" fontWeight="600" fill="#5B4A26">Shared</text>
      <text x="70" y="149" textAnchor="middle" fontSize="11" fill="#7A6A44">tools · parking</text>
      <text x="70" y="168" textAnchor="middle" fontSize="11" fill="#7A6A44">0.50 ac</text>
      <rect x="12" y="312" width="476" height="18" rx="6" fill="#E3DAC4" />
      <line x1="20" y1="321" x2="480" y2="321" stroke="#B8A57B" strokeDasharray="8 6" strokeWidth="2" />
      {PLOTS.map((p, i) => (
        <g key={p.id} style={animated ? { animation: `fade-up 0.7s ${0.25 + i * 0.15}s both` } : undefined}>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="12" fill={p.fill} />
          <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="12" fill="url(#ill-furrows)" />
          <text x={p.x + 14} y={p.y + 26} fontSize="12" fontWeight="700" letterSpacing="1.5" fill={p.dark ? "#04291E" : "#FEFDF9"} opacity="0.85">
            PLOT {p.id}
          </text>
          <text x={p.x + 14} y={p.y + p.h - 32} fontSize="17" fontWeight="600" fontFamily="var(--font-serif)" fill={p.dark ? "#04291E" : "#FEFDF9"}>
            {p.label}
          </text>
          <text x={p.x + 14} y={p.y + p.h - 14} fontSize="12.5" fill={p.dark ? "#04291E" : "#FEFDF9"} opacity="0.9">
            {p.acres} ac
          </text>
        </g>
      ))}
    </svg>
  );
}
