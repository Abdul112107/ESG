import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
  options?: Array<{ label: string; value: string }>;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  selectedYear,
  onYearChange,
  options = [
    { label: 'Reporting Year 2026', value: '2026' },
    { label: 'Reporting Year 2025', value: '2025' },
    { label: 'All Historic Periods', value: '' }
  ]
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-flex items-center">
        <Calendar className="w-3.5 h-3.5 text-purple-400/70 absolute left-2.5 pointer-events-none" />
        <select
          value={selectedYear}
          onChange={e => onYearChange(e.target.value)}
          className="pl-8 pr-7 py-1.5 text-xs font-semibold text-white bg-white/[0.06] border border-white/[0.1] rounded-xl hover:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 appearance-none cursor-pointer transition-all"
          style={{ backgroundImage: 'none' }}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-[#1a1035] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-2.5 text-purple-400/60 pointer-events-none text-[10px]">▼</span>
      </div>
    </div>
  );
};
