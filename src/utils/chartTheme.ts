/**
 * Shared chart theme constants for all Recharts components.
 * Import from any page to keep chart styling consistent.
 */

/** Primary series palette: purple → cyan → mint → magenta → amber → teal */
export const CHART_COLORS = {
  purple:  '#a78bfa',   // violet-400
  cyan:    '#22d3ee',   // cyan-400
  mint:    '#34d399',   // emerald-400
  magenta: '#f472b6',   // pink-400
  amber:   '#fbbf24',   // amber-400
  teal:    '#2dd4bf',   // teal-400
  indigo:  '#818cf8',   // indigo-400
  rose:    '#fb7185',   // rose-400
};

/** Ordered series colors for multi-series charts */
export const SERIES_PALETTE = [
  CHART_COLORS.purple,
  CHART_COLORS.cyan,
  CHART_COLORS.mint,
  CHART_COLORS.magenta,
  CHART_COLORS.amber,
  CHART_COLORS.teal,
];

/** Shared CartesianGrid props */
export const GRID_PROPS = {
  strokeDasharray: '3 4',
  stroke: 'rgba(139,92,246,0.10)',
  vertical: false,
} as const;

/** Shared XAxis tick style */
export const AXIS_TICK_STYLE = {
  fontSize: 11,
  fill: 'rgba(148,163,184,0.70)',
  fontFamily: 'JetBrains Mono, monospace',
};

/** Shared dark tooltip style */
export const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15,9,35,0.95)',
  borderColor: 'rgba(139,92,246,0.35)',
  borderRadius: '14px',
  fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
  boxShadow: '0 8px 32px rgba(0,0,0,0.60), 0 0 20px rgba(109,40,217,0.15)',
  color: '#f1f5f9',
  padding: '10px 14px',
  border: '1px solid rgba(139,92,246,0.35)',
};

/** Scope badge colors */
export const SCOPE_COLORS: Record<string, string> = {
  'Scope 1': CHART_COLORS.mint,
  'Scope 2': CHART_COLORS.cyan,
  'Scope 3': CHART_COLORS.amber,
};
