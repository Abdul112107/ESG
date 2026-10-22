import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  footerNote?: string;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  action,
  children,
  footerNote,
  className = ''
}) => {
  return (
    <div
      className={`relative rounded-2xl p-5 flex flex-col justify-between overflow-hidden bouncy-card ${className}`}
      style={{
        background: 'linear-gradient(160deg, rgba(20,11,44,0.88) 0%, rgba(12,7,28,0.92) 100%)',
        backdropFilter: 'blur(24px) saturate(150%)',
        WebkitBackdropFilter: 'blur(24px) saturate(150%)',
        border: '1px solid rgba(139,92,246,0.18)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset, 0 8px 32px rgba(0,0,0,0.55), 0 0 50px rgba(109,40,217,0.08)',
      }}
    >
      {/* Top illuminated border */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-purple-500/35 to-transparent pointer-events-none" />
      {/* Corner ambient glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-purple-600/08 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 relative z-10">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-xs mt-0.5 font-medium" style={{ color: 'rgba(167,139,250,0.65)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Chart area */}
      <div className="w-full grow min-h-[260px] flex items-center justify-center relative z-10">
        {children}
      </div>

      {/* Footer */}
      {footerNote && (
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] relative z-10"
          style={{ color: 'rgba(148,163,184,0.55)' }}>
          <span>{footerNote}</span>
          <span className="font-mono" style={{ color: 'rgba(167,139,250,0.50)' }}>ISO 14064 / GHG Protocol</span>
        </div>
      )}
    </div>
  );
};
