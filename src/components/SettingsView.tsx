import React, { useState } from 'react';
import { 
  Moon, 
  Sun, 
  Monitor, 
  MapPin, 
  Navigation, 
  Bell, 
  BellOff, 
  Save,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UserSettings, Coordinates } from '../types';
import { geocodeLocation } from '../lib/api';

interface SettingsViewProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [manualQuery, setManualQuery] = useState(settings.manualLocation?.name || '');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingResult, setGeocodingResult] = useState<{ success: boolean, message: string } | null>(null);

  const handleSearch = async () => {
    if (!manualQuery.trim()) return;
    
    setIsGeocoding(true);
    setGeocodingResult(null);
    
    const result = await geocodeLocation(manualQuery);
    
    if (result) {
      setLocalSettings({
        ...localSettings,
        manualLocation: {
          name: result.name,
          coordinates: { lat: result.lat, lng: result.lon }
        }
      });
      setGeocodingResult({ success: true, message: `Lokasi ditemukan: ${result.name}` });
    } else {
      setGeocodingResult({ success: false, message: 'Lokasi tidak ditemukan. Coba nama wilayah lain.' });
    }
    setIsGeocoding(false);
  };

  const handleSave = () => {
    if (localSettings.locationMode === 'manual' && !localSettings.manualLocation) {
      setGeocodingResult({ success: false, message: 'Harap cari dan pilih lokasi terlebih dahulu.' });
      return;
    }
    onSave(localSettings);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      {/* Theme Selection */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" />
          Tampilan & Tema
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', label: 'Terang', icon: Sun },
            { id: 'dark', label: 'Gelap', icon: Moon },
            { id: 'system', label: 'Sistem', icon: Monitor }
          ].map((theme) => {
            const Icon = theme.icon;
            const isActive = localSettings.theme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setLocalSettings({ ...localSettings, theme: theme.id as any })}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  isActive 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' 
                    : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 text-slate-500'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-bold">{theme.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Location Mode */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-rose-500" />
          Pengaturan Lokasi
        </h3>

        <div className="space-y-6">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              onClick={() => setLocalSettings({ ...localSettings, locationMode: 'gps' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                localSettings.locationMode === 'gps'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                  : 'text-slate-50'
              }`}
            >
              <Navigation className="w-4 h-4" />
              GPS Otomatis
            </button>
            <button
              onClick={() => setLocalSettings({ ...localSettings, locationMode: 'manual' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                localSettings.locationMode === 'manual'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                  : 'text-slate-50'
              }`}
            >
              <Search className="w-4 h-4" />
              Lokasi Manual
            </button>
          </div>

          {localSettings.locationMode === 'manual' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Wilayah (Kelurahan, Kecamatan, Kota)</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Contoh: Menteng, Jakarta Pusat"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isGeocoding || !manualQuery.trim()}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Cari
                  </button>
                </div>
              </div>

              {geocodingResult && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                  geocodingResult.success ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'
                }`}>
                  {geocodingResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {geocodingResult.message}
                </div>
              )}

              {localSettings.manualLocation && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lokasi Terpilih</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{localSettings.manualLocation.name}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Notifications & Radius */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" />
          Notifikasi & Jangkauan
        </h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Pemberitahuan Aktif</p>
              <p className="text-xs text-slate-500">Terima peringatan real-time untuk bencana baru.</p>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, notifications: !localSettings.notifications })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                localSettings.notifications ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSettings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Radius Pemantauan</p>
              <span className="text-xs font-bold text-blue-600">{localSettings.radius} km</span>
            </div>
            <input 
              type="range"
              min="50"
              max="1000"
              step="50"
              value={localSettings.radius}
              onChange={(e) => setLocalSettings({ ...localSettings, radius: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">50km</span>
              <span className="text-[10px] text-slate-400">1000km</span>
            </div>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Save className="w-5 h-5" />
        Simpan Pengaturan
      </button>
    </div>
  );
};

export default SettingsView;
