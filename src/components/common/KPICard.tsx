import React, { useEffect, useRef, useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    label?: string;
  };
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  badge?: string;
  gradient?: string;
  accentColor?: 'cyan' | 'mint' | 'teal' | 'violet' | 'magenta' | 'amber';
  delay?: number;
}

// Accent color palettes
const ACCENT: Record<string, {
  glow: string; border: string; iconBg: string; iconRing: string;
  valueTo: string; badgeBg: string; badgeText: string; badgeBorder: string;
}> = {
  cyan: {
    glow:        'rgba(6,182,212,0.22)',
    border:      'rgba(6,182,212,0.30)',
    iconBg:      'from-cyan-500 to-teal-500',
    iconRing:    'shadow-cyan-500/40',
    valueTo:     '#67e8f9',
    badgeBg:     'rgba(6,182,212,0.12)',
    badgeText:   '#67e8f9',
    badgeBorder: 'rgba(6,182,212,0.30)',
  },
  mint: {
    glow:        'rgba(16,185,129,0.20)',
    border:      'rgba(16,185,129,0.28)',
    iconBg:      'from-emerald-500 to-teal-400',
    iconRing:    'shadow-emerald-500/40',
    valueTo:     '#6ee7b7',
    badgeBg:     'rgba(16,185,129,0.12)',
    badgeText:   '#6ee7b7',
    badgeBorder: 'rgba(16,185,129,0.30)',
  },
  teal: {
    glow:        'rgba(20,184,166,0.20)',
    border:      'rgba(20,184,166,0.28)',
    iconBg:      'from-teal-500 to-cyan-400',
    iconRing:    'shadow-teal-500/40',
    valueTo:     '#5eead4',
    badgeBg:     'rgba(20,184,166,0.12)',
    badgeText:   '#5eead4',
    badgeBorder: 'rgba(20,184,166,0.30)',
  },
  violet: {
    glow:        'rgba(139,92,246,0.25)',
    border:      'rgba(139,92,246,0.35)',
    iconBg:      'from-violet-500 to-purple-600',
    iconRing:    'shadow-violet-500/40',
    valueTo:     '#c4b5fd',
    badgeBg:     'rgba(139,92,246,0.15)',
    badgeText:   '#c4b5fd',
    badgeBorder: 'rgba(139,92,246,0.35)',
  },
  magenta: {
    glow:        'rgba(219,39,119,0.20)',
    border:      'rgba(219,39,119,0.28)',
    iconBg:      'from-pink-500 to-rose-500',
    iconRing:    'shadow-pink-500/40',
    valueTo:     '#f9a8d4',
    badgeBg:     'rgba(219,39,119,0.12)',
    badgeText:   '#f9a8d4',
    badgeBorder: 'rgba(219,39,119,0.28)',
  },
  amber: {
    glow:        'rgba(245,158,11,0.18)',
    border:      'rgba(245,158,11,0.26)',
    iconBg:      'from-amber-500 to-orange-500',
    iconRing:    'shadow-amber-500/40',
    valueTo:     '#fcd34d',
    badgeBg:     'rgba(245,158,11,0.12)',
    badgeText:   '#fcd34d',
    badgeBorder: 'rgba(245,158,11,0.28)',
  },
};

function animateValue(
  element: HTMLElement,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
  duration: number
) {
  let startTime: number | null = null;
  const step = (timestamp: number) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * easeOut);
    element.textContent = `${prefix}${current.toLocaleString()}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  unit,
  subtext,
  trend,
  icon: Icon,
  badge,
  accentColor = 'violet',
  delay = 0,
}) => {
  const valueRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const valStr   = typeof value === 'number' ? value.toString() : value;
  const prefix   = valStr.startsWith('$') ? '$' : '';
  const cleanStr = valStr.replace('$', '').trim();
  const numericEnd = parseFloat(cleanStr.replace(/,/g, ''));
  const isNumber = !isNaN(numericEnd) && !cleanStr.includes('%');

  const ac = ACCENT[accentColor] ?? ACCENT.violet;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (isVisible && valueRef.current && isNumber) {
      animateValue(valueRef.current, 0, numericEnd, prefix, '', 850);
    }
  }, [isVisible, numericEnd, prefix, isNumber]);

  return (
    <div
      className={`relative rounded-3xl p-5 overflow-hidden group transition-all duration-300 ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      }`}
      style={{
        background: 'linear-gradient(145deg, rgba(26,15,54,0.85) 0%, rgba(16,9,36,0.90) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${ac.border}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.50), 0 0 40px ${ac.glow}`,
      }}
    >
      {/* Corner accent glow */}
      <div
        className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-40 pointer-events-none group-hover:opacity-70 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${ac.glow} 0%, transparent 70%)` }}
      />
      {/* Bottom edge shimmer line */}
      <div
        className="absolute bottom-0 left-4 right-4 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${ac.border}, transparent)` }}
      />

      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </span>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${ac.iconBg} p-px shadow-lg ${ac.iconRing} shrink-0`}
          >
            <div className="w-full h-full rounded-[15px] bg-[#110930] flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Value row */}
      <div className="flex items-baseline gap-2 mb-1 relative z-10">
        <span
          ref={valueRef}
          className="text-3xl sm:text-4xl font-black tracking-tight font-mono tabular-nums"
          style={{
            background: `linear-gradient(135deg, #ffffff 0%, ${ac.valueTo} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {valStr}
        </span>
        {unit && (
          <span className="text-sm font-bold font-mono" style={{ color: ac.valueTo, opacity: 0.80 }}>
            {unit}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-[11px] text-slate-400 mb-3 relative z-10">{subtext}</p>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] relative z-10">
        {trend ? (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{
                background: trend.isNeutral
                  ? 'rgba(100,116,139,0.20)'
                  : trend.isPositive
                  ? 'rgba(16,185,129,0.15)'
                  : 'rgba(244,63,94,0.15)',
                color: trend.isNeutral ? '#94a3b8' : trend.isPositive ? '#34d399' : '#fb7185',
                border: `1px solid ${
                  trend.isNeutral ? 'rgba(100,116,139,0.30)' : trend.isPositive ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)'
                }`,
              }}
            >
              {trend.isPositive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
              }
              {trend.value}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">{trend.label || 'vs period'}</span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
            {subtext || ''}
          </span>
        )}
        {badge && (
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0"
            style={{
              background: ac.badgeBg,
              color: ac.badgeText,
              border: `1px solid ${ac.badgeBorder}`,
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};
