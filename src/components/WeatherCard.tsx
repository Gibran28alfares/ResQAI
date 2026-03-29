import React from 'react';
import { Cloud, Droplets, Wind, Thermometer } from 'lucide-react';
import { WeatherData } from '../types';

interface WeatherCardProps {
  weather: WeatherData | null;
  loading: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, loading }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 w-1/3 mb-4 rounded"></div>
        <div className="h-12 bg-slate-100 dark:bg-slate-800 w-1/2 mb-6 rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded"></div>
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 italic text-sm">
        Data cuaca tidak tersedia. Harap periksa kunci API.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Cuaca Lokal</h3>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{weather.locationName}</p>
        </div>
        <img 
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
          alt={weather.condition}
          className="w-12 h-12 -mt-2"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl font-bold text-slate-900 dark:text-white">{Math.round(weather.temp)}°C</span>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 capitalize">{weather.condition}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{weather.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Kelembapan</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{weather.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <Wind className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Angin</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{weather.windSpeed} m/s</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
