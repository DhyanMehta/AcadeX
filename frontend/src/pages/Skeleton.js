import React from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   Reusable Skeleton Primitives
   Usage:
     <Sk.Text />              — single text line
     <Sk.Text width="60%" /> — custom width
     <Sk.Title />             — wider/taller title block
     <Sk.Circle size={40} />  — circular avatar placeholder
     <Sk.Rect height={180} /> — arbitrary rectangle
     <Sk.StatCard />          — full stat card placeholder
     <Sk.TableRows n={5} />   — n table row skeletons
     <Sk.ChartBox height={220} />
     <Sk.CardBlock lines={3} />
───────────────────────────────────────────────────────────────────────── */

const base = {
  display: 'block',
  borderRadius: 5,
  background: 'linear-gradient(90deg, #e5e7eb 0px, #f3f4f6 200px, #e5e7eb 400px)',
  backgroundSize: '600px 100%',
  animation: 'shimmer 1.4s infinite linear',
};

export const Sk = {
  Text: ({ width = '100%', style = {} }) => (
    <span style={{ ...base, height: 13, width, marginBottom: 8, ...style }} />
  ),

  Title: ({ width = '55%', style = {} }) => (
    <span style={{ ...base, height: 20, width, marginBottom: 14, ...style }} />
  ),

  Circle: ({ size = 36, style = {} }) => (
    <span style={{ ...base, width: size, height: size, borderRadius: '50%', flexShrink: 0, ...style }} />
  ),

  Rect: ({ height = 120, width = '100%', radius = 8, style = {} }) => (
    <span style={{ ...base, height, width, borderRadius: radius, display: 'block', ...style }} />
  ),

  /* Full stat card */
  StatCard: () => (
    <div className="stat-card" style={{ pointerEvents: 'none' }}>
      <Sk.Rect height={38} width={38} radius={7} style={{ marginBottom: 14 }} />
      <Sk.Rect height={28} width="50%" style={{ marginBottom: 8, borderRadius: 5 }} />
      <Sk.Text width="70%" style={{ marginBottom: 0 }} />
    </div>
  ),

  /* Stat grid (n cards) */
  StatGrid: ({ n = 4 }) => (
    <div className="stat-grid">
      {Array.from({ length: n }).map((_, i) => <Sk.StatCard key={i} />)}
    </div>
  ),

  /* Table rows */
  TableRows: ({ n = 5, cols = 4 }) => (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <tr key={i} style={{ pointerEvents: 'none' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <Sk.Text width={j === 0 ? '80%' : `${40 + Math.random() * 40}%`} style={{ marginBottom: 0 }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  ),

  /* Chart placeholder box */
  ChartBox: ({ height = 220 }) => (
    <div className="card">
      <Sk.Title width="45%" />
      <Sk.Rect height={height} radius={8} />
    </div>
  ),

  /* Generic card with text lines */
  CardBlock: ({ lines = 3, title = true }) => (
    <div className="card">
      {title && <Sk.Title />}
      {Array.from({ length: lines }).map((_, i) => (
        <Sk.Text key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  ),

  /* Profile panel skeleton */
  ProfilePanel: () => (
    <div className="card" style={{ position: 'sticky', top: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <Sk.Circle size={42} />
        <div style={{ flex: 1 }}>
          <Sk.Title width="70%" style={{ marginBottom: 6 }} />
          <Sk.Text width="90%" style={{ marginBottom: 0 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <Sk.Rect height={64} radius={8} />
        <Sk.Rect height={64} radius={8} />
      </div>
      <Sk.Rect height={80} radius={8} style={{ marginBottom: 12 }} />
      <Sk.Rect height={38} radius={7} />
    </div>
  ),
};

/* ─── Full-page skeleton layouts ────────────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <div>
      <div className="page-header">
        <Sk.Title width="30%" style={{ marginBottom: 6 }} />
        <Sk.Text width="20%" style={{ marginBottom: 0 }} />
      </div>
      <Sk.StatGrid n={4} />
      <div className="skeleton-chart-grid">
        <Sk.ChartBox height={220} />
        <Sk.ChartBox height={220} />
      </div>
      <Sk.CardBlock lines={4} />
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div>
      <div className="page-header">
        <Sk.Title width="28%" style={{ marginBottom: 6 }} />
        <Sk.Text width="18%" style={{ marginBottom: 0 }} />
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i}><Sk.Text width="60%" style={{ marginBottom: 0 }} /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Sk.TableRows n={rows} cols={cols} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ n = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
      {Array.from({ length: n }).map((_, i) => (
        <Sk.CardBlock key={i} lines={3} />
      ))}
    </div>
  );
}

export default Sk;
