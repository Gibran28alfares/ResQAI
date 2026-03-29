import React from 'react';
import { Disaster } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { 
  Activity, 
  Droplets, 
  Mountain, 
  CloudRain, 
  AlertTriangle, 
  Info,
  ExternalLink
} from 'lucide-react';

interface DisasterListProps {
  disasters: Disaster[];
  loading: boolean;
}

const DisasterList: React.FC<DisasterListProps> = ({ disasters, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'earthquake': return <Activity className="w-5 h-5" />;
      case 'flood': return <Droplets className="w-5 h-5" />;
      case 'landslide': return <Mountain className="w-5 h-5" />;
      case 'volcano': return <Mountain className="w-5 h-5" />;
      case 'weather': return <CloudRain className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getColor = (severity: string, type: string) => {
    if (type === 'earthquake') {
      return 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400';
    }
    switch (severity) {
      case 'high': return 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400';
      case 'medium': return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400';
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Umpan Bencana Terkini</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Pembaruan Real-time</span>
      </div>
      
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto custom-scrollbar">
        {disasters.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Info className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-sm italic">Tidak ada laporan bencana terbaru saat ini.</p>
          </div>
        ) : (
          disasters.map((disaster) => (
            <div key={disaster.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-start gap-4">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110
                  ${getColor(disaster.severity, disaster.type)}
                `}>
                  {getIcon(disaster.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {disaster.title}
                      </h4>
                      {disaster.time >= Date.now() - 24 * 60 * 60 * 1000 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-black bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 uppercase tracking-tighter w-fit">
                          24 Jam Terakhir
                        </span>
                      )}
                    </div>
                    {disaster.url && (
                      <a 
                        href={disaster.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {disaster.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                      {disaster.location}
                    </span>
                    <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {formatDistanceToNow(disaster.time, { addSuffix: true, locale: localeId })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DisasterList;
