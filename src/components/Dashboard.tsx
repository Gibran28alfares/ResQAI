import React from 'react';
import { Shield, AlertTriangle, Zap, Info } from 'lucide-react';
import { RiskStatus, DisasterSummary } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardProps {
  summary: DisasterSummary;
  lastUpdated: number;
}

const Dashboard: React.FC<DashboardProps> = ({ summary, lastUpdated }) => {
  const statusConfig = {
    safe: {
      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      icon: Shield,
      label: 'AMAN',
      description: 'Tidak ada ancaman besar yang terdeteksi di area Anda.'
    },
    alert: {
      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      icon: Info,
      label: 'WASPADA',
      description: 'Aktivitas seismik kecil atau perubahan cuaca terdeteksi. Tetap terinformasi.'
    },
    danger: {
      color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
      icon: AlertTriangle,
      label: 'BAHAYA',
      description: 'Risiko bencana signifikan terdeteksi. Ikuti protokol darurat setempat.'
    }
  };

  const config = statusConfig[summary.status];
  const StatusIcon = config.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Risk Status Card */}
      <div className={cn(
        "col-span-1 md:col-span-2 p-6 rounded-2xl border flex items-start gap-4 shadow-sm",
        config.color
      )}>
        <div className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50">
          <StatusIcon className="w-8 h-8" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold tracking-wider uppercase opacity-70">Status Risiko Saat Ini</span>
            <span className="px-2 py-0.5 rounded-full bg-white/50 dark:bg-slate-800/50 text-[10px] font-bold border border-current">
              {config.label}
            </span>
            <span className="ml-auto text-[10px] font-bold opacity-50 uppercase tracking-tighter">
              Update: {new Date(lastUpdated).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-2">{summary.message}</h2>
          <p className="text-sm opacity-90">{config.description}</p>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-900 dark:text-white uppercase text-xs tracking-widest">Aktivitas 24 Jam</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Bencana (24 Jam Terakhir)</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{summary.activeDisastersCount}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-full rounded-full" 
              style={{ width: `${Math.min(100, (summary.activeDisastersCount / 10) * 100)}%` }}
            />
          </div>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 italic">*Total laporan bencana di Indonesia (Gempa, Banjir, Longsor, dll)</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
