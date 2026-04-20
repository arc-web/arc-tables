// Design system extracted from the three reference HTML files:
// /tmp/schema_viz.html, /tmp/leads_flow.html, /tmp/client_ecosystem.html
//
// Single source of truth for colors, fonts, animations.

export const PALETTE = {
  bg: '#06060f',
  cardBg: 'rgba(10,14,30,0.94)',
  text: '#e0e8ff',
  textDim: 'rgba(200,210,255,0.55)',
  textMuted: 'rgba(255,255,255,0.18)',
  // Group colors
  cyan:   { stroke: '#00d4ff', glow: 'rgba(0,212,255,0.18)', tint: 'rgba(0,212,255,0.04)' },
  orange: { stroke: '#ff8c00', glow: 'rgba(255,140,0,0.18)', tint: 'rgba(255,140,0,0.04)' },
  green:  { stroke: '#00dc82', glow: 'rgba(0,220,130,0.18)', tint: 'rgba(0,220,130,0.04)' },
  purple: { stroke: '#bb77ff', glow: 'rgba(187,119,255,0.18)', tint: 'rgba(187,119,255,0.04)' },
  yellow: { stroke: '#ffc800', glow: 'rgba(255,200,0,0.18)', tint: 'rgba(255,200,0,0.04)' },
  white:  { stroke: '#ffffff', glow: 'rgba(255,255,255,0.18)', tint: 'rgba(255,255,255,0.03)' },
  red:    { stroke: '#ff5050', glow: 'rgba(255,80,80,0.18)', tint: 'rgba(255,80,80,0.04)' },
} as const;

export type GroupColor = 'cyan' | 'orange' | 'green' | 'purple' | 'yellow' | 'white' | 'red';

export const baseCss = `
* { margin:0; padding:0; box-sizing:border-box; }
body {
  background: ${PALETTE.bg};
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: ${PALETTE.text};
  min-height: 100vh;
  overflow-x: hidden;
}
body::before {
  content:''; position:fixed; inset:0;
  background-image: radial-gradient(circle, rgba(0,200,255,0.06) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none; z-index: 0;
}
@keyframes scanline { 0% { transform:translateY(-100%); } 100% { transform:translateY(200vh); } }
body::after {
  content:''; position:fixed; left:0; right:0; height:2px;
  background: linear-gradient(transparent, rgba(0,200,255,0.04), transparent);
  animation: scanline 6s linear infinite; pointer-events:none; z-index:0;
}
h1 {
  text-align:center; padding:26px 0 4px;
  font-size:12px; letter-spacing:5px; text-transform:uppercase;
  color: rgba(0,200,255,0.45); position:relative; z-index:10;
}
#sub {
  text-align:center; font-size:10px; color: ${PALETTE.textMuted};
  letter-spacing:2px; margin-bottom:24px; position:relative; z-index:10;
}
`.trim();
