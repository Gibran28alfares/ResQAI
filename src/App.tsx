import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Radar,
  Map as MapIcon,
  LayoutDashboard,
  Settings,
  Bell,
  AlertTriangle,
} from "lucide-react";

import { useGeolocation } from "./hooks/useGeolocation";
import { fetchEarthquakes, fetchWeather } from "./lib/api";
import { fetchDisasters, analyzeRiskStatus } from "./lib/disasterService";
import {
  Earthquake,
  WeatherData,
  DisasterSummary,
  RiskStatus,
  Disaster,
  UserSettings,
  Coordinates,
} from "./types";

import MapView from "./components/Map";
import Dashboard from "./components/Dashboard";
import WeatherCard from "./components/WeatherCard";
import DisasterList from "./components/DisasterList";
import AIAssistant from "./components/AIAssistant";
import EmergencyMode from "./components/EmergencyMode";
import SettingsView from "./components/SettingsView";

export default function App() {
  const {
    location: gpsLocation,
    loading: geoLoading,
    error: geoError,
  } = useGeolocation();
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem("resqai_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to defaults
      }
    }
    return {
      theme: "system",
      locationMode: "gps",
      notifications: true,
      radius: 500,
    };
  });

  const location = useMemo(() => {
    if (settings.locationMode === "manual" && settings.manualLocation) {
      return settings.manualLocation.coordinates;
    }
    return gpsLocation;
  }, [settings.locationMode, settings.manualLocation, gpsLocation]);

  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>(() => {
    const saved = localStorage.getItem("resqai_disasters");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(() => {
    const saved = localStorage.getItem("resqai_disasters");
    return !saved; // Start as not loading if we have cached data
  });
  const [refreshing, setRefreshing] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    status: RiskStatus;
    message: string;
  }>(() => {
    const saved = localStorage.getItem("resqai_ai_summary");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {
      status: "safe",
      message: "Menganalisis Kondisi...",
    };
  });

  // Granular Last Updated States
  const [lastQuakeUpdate, setLastQuakeUpdate] = useState<number>(0);
  const [lastDisasterUpdate, setLastDisasterUpdate] = useState<number>(() => {
    const saved = localStorage.getItem("resqai_last_updated");
    return saved ? parseInt(saved) : 0;
  });
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState<number>(0);

  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [currentView, setCurrentView] = useState<
    "dashboard" | "map" | "alerts" | "settings"
  >("dashboard");

  // API Call Protection & Locking
  const isFetchingQuakes = useRef(false);
  const isFetchingDisasters = useRef(false);
  const isFetchingWeather = useRef(false);
  const prevLocationKey = useRef<string | null>(null);

  const DISASTER_TTL = 15 * 60 * 1000; // 15 minutes for Gemini (expensive)
  const QUAKE_TTL = 2 * 60 * 1000; // 2 minutes for USGS (cheap/fast)
  const WEATHER_TTL = 10 * 60 * 1000; // 10 minutes for Weather

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (theme: "light" | "dark" | "system") => {
      const root = window.document.documentElement;
      const body = window.document.body;

      console.log("Applying theme:", theme);
      root.classList.remove("light", "dark");
      body.classList.remove("light", "dark");

      let finalTheme: "light" | "dark" = "light";

      if (theme === "system") {
        finalTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        console.log("System theme resolved to:", finalTheme);
      } else {
        finalTheme = theme as "light" | "dark";
        console.log("Manual theme set to:", finalTheme);
      }

      root.classList.add(finalTheme);
      body.classList.add(finalTheme);
      console.log("Classes on html:", root.className);
    };

    applyTheme(settings.theme);

    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [settings.theme]);

  const fetchWeatherData = async (force = false) => {
    if (!location || isFetchingWeather.current) return;

    const now = Date.now();
    if (!force && now - lastWeatherUpdate < WEATHER_TTL) return;

    try {
      isFetchingWeather.current = true;
      const data = await fetchWeather(location.lat, location.lng);
      if (data) {
        setWeather(data);
        setLastWeatherUpdate(Date.now());
      }
    } catch (error) {
      console.error("Weather fetch error:", error);
    } finally {
      isFetchingWeather.current = false;
    }
  };

  const loadQuakes = async (force = false) => {
    if (isFetchingQuakes.current) return;

    const now = Date.now();
    if (!force && now - lastQuakeUpdate < QUAKE_TTL) return;

    try {
      isFetchingQuakes.current = true;
      const quakes = await fetchEarthquakes();
      setEarthquakes(quakes);
      setLastQuakeUpdate(Date.now());

      // Process quakes into disasters feed
      const earthquakeDisasters: Disaster[] = quakes.map((q) => ({
        id: q.id,
        type: "earthquake",
        title: `Gempa Bumi M ${q.mag.toFixed(1)}`,
        location: q.place,
        time: q.time,
        description: `Gempa bumi dengan magnitudo ${q.mag.toFixed(1)} terdeteksi di ${q.place}. Kedalaman: ${q.depth.toFixed(1)}km.`,
        severity: q.mag >= 5 ? "high" : q.mag >= 3 ? "medium" : "low",
        url: q.url,
        coordinates: q.coordinates,
      }));

      updateDisasterFeed(earthquakeDisasters);
    } catch (error) {
      console.error("Quake fetch error:", error);
    } finally {
      isFetchingQuakes.current = false;
    }
  };

  const calculateDistance = (p1: Coordinates, p2: Coordinates) => {
    const R = 6371; // Earth's radius in km
    const dLat = (p2.lat - p1.lat) * (Math.PI / 180);
    const dLon = (p2.lng - p1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1.lat * (Math.PI / 180)) *
        Math.cos(p2.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const loadDisasters = async (force = false) => {
    if (isFetchingDisasters.current) return;

    const now = Date.now();
    if (
      !force &&
      now - lastDisasterUpdate < DISASTER_TTL &&
      disasters.length > 0
    ) {
      setLoading(false);
      return;
    }

    try {
      isFetchingDisasters.current = true;
      setRefreshing(true);

      const locationName =
        settings.locationMode === "manual" && settings.manualLocation
          ? settings.manualLocation.name
          : weather?.locationName || "Indonesia";

      const generalDisasters = await fetchDisasters(locationName);
      updateDisasterFeed(generalDisasters);

      // AI Risk Analysis
      if (location) {
        const nearbyQuakes = earthquakes.filter(
          (q) => calculateDistance(location, q.coordinates) < settings.radius,
        );
        const nearbyDisasters = generalDisasters.filter((d) => {
          if (d.coordinates)
            return calculateDistance(location, d.coordinates) < settings.radius;
          return true; // If no coordinates, assume it might be relevant if Gemini returned it for this location
        });

        const analysis = await analyzeRiskStatus(
          locationName,
          weather,
          nearbyQuakes,
          nearbyDisasters,
        );
        setAiSummary(analysis);
        localStorage.setItem("resqai_ai_summary", JSON.stringify(analysis));
      }

      const updateTime = Date.now();
      setLastDisasterUpdate(updateTime);
      localStorage.setItem("resqai_last_updated", updateTime.toString());
    } catch (error) {
      console.error("Disaster fetch error:", error);
    } finally {
      isFetchingDisasters.current = false;
      setRefreshing(false);
      setLoading(false);
    }
  };

  const updateDisasterFeed = (newItems: Disaster[]) => {
    setDisasters((prev) => {
      const all = [...newItems, ...prev];
      const unique = Array.from(new Map(all.map((d) => [d.id, d])).values());
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const filtered = unique
        .filter((d) => d.time >= oneWeekAgo)
        .sort((a, b) => b.time - a.time);

      localStorage.setItem("resqai_disasters", JSON.stringify(filtered));
      return filtered;
    });
  };

  const loadAllData = (force = false) => {
    fetchWeatherData(force);
    loadQuakes(force);
    loadDisasters(force);
  };

  // 1. Effect for Weather & Location-based triggers (Rounded to avoid jitter)
  const roundedLat = location ? Math.round(location.lat * 100) / 100 : null;
  const roundedLng = location ? Math.round(location.lng * 100) / 100 : null;

  useEffect(() => {
    if (!location) return;

    const key = `${roundedLat}-${roundedLng}`;
    if (prevLocationKey.current === key) return;

    prevLocationKey.current = key;

    fetchWeatherData();
    loadQuakes();
  }, [roundedLat, roundedLng]);

  // 2. Effect for Disaster Search (Gemini) - Depends on location context
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDisasters();
    }, 300); // Reduced delay for better UX
    return () => clearTimeout(timer);
  }, [roundedLat, roundedLng, settings.locationMode]);

  // 3. Background Refresh Interval
  useEffect(() => {
    const interval = setInterval(
      () => {
        loadQuakes();
        loadDisasters();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem("resqai_settings", JSON.stringify(newSettings));
    setCurrentView("dashboard");
  };

  const summary = useMemo((): DisasterSummary => {
    if (!location)
      return {
        status: "safe",
        message: "Menunggu Lokasi",
        recentEarthquakesCount: 0,
        maxMagnitude: 0,
        activeDisastersCount: 0,
      };

    const quakesWithDistance = earthquakes.map((q) => ({
      ...q,
      distance: calculateDistance(location, q.coordinates),
    }));

    const nearbyQuakes = quakesWithDistance.filter(
      (q) => q.distance < settings.radius,
    );
    const maxMag =
      nearbyQuakes.length > 0 ? Math.max(...nearbyQuakes.map((q) => q.mag)) : 0;

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Filter active disasters by time AND distance (local only)
    const localActiveDisasters = disasters.filter((d) => {
      const isRecent = d.time >= twentyFourHoursAgo;
      if (!isRecent) return false;

      // If coordinates available, check distance
      if (d.coordinates) {
        return calculateDistance(location, d.coordinates) < settings.radius;
      }

      // If no coordinates, we assume it's local if it was fetched in the current context
      // but to be safe, we can check if the location string matches or just include it
      return true;
    });

    return {
      status: aiSummary.status,
      message: aiSummary.message,
      recentEarthquakesCount: earthquakes.length,
      maxMagnitude: maxMag,
      activeDisastersCount: localActiveDisasters.length,
    };
  }, [earthquakes, location, disasters, aiSummary, settings.radius]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Radar className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
              ResQAI
            </h1>
            <p className="text-[8px] font-bold text-blue-600 uppercase tracking-tighter mt-1">
              Know the Risk. Act Fast.
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem
            icon={LayoutDashboard}
            label="Dasbor"
            active={currentView === "dashboard"}
            onClick={() => setCurrentView("dashboard")}
          />
          <NavItem
            icon={MapIcon}
            label="Peta Interaktif"
            active={currentView === "map"}
            onClick={() => setCurrentView("map")}
          />
          <NavItem
            icon={Bell}
            label="Peringatan"
            active={currentView === "alerts"}
            onClick={() => setCurrentView("alerts")}
          />
          <NavItem
            icon={Settings}
            label="Pengaturan"
            active={currentView === "settings"}
            onClick={() => setCurrentView("settings")}
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Status Sistem
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Pemantauan Aktif
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 pb-24 md:pb-0 overflow-hidden">
        {/* Header - Mobile & Desktop */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-30">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="md:hidden bg-blue-600 p-1.5 rounded-lg">
                <Radar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white md:text-lg">
                  {currentView === "dashboard"
                    ? "Dasbor Utama"
                    : currentView === "map"
                      ? "Peta Interaktif"
                      : currentView === "alerts"
                        ? "Peringatan"
                        : "Pengaturan"}
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium md:text-xs">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Pusat Kendali
                </span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">
                  Terhubung
                </span>
              </div>
              <button
                onClick={() => setIsEmergencyMode(!isEmergencyMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isEmergencyMode
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Mode Darurat</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentView === "dashboard" && (
              <div className="space-y-8">
                <Dashboard
                  summary={summary}
                  lastUpdated={lastDisasterUpdate || lastQuakeUpdate}
                />

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  <div className="xl:col-span-8 space-y-8 order-2 xl:order-1">
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          Umpan Bencana Terkini di Indonesia
                        </h3>
                      </div>
                      <DisasterList disasters={disasters} loading={loading} />
                    </section>
                  </div>

                  <div className="xl:col-span-4 space-y-8 order-1 xl:order-2">
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                        Pemantauan Cuaca
                      </h3>
                      <WeatherCard weather={weather} loading={loading} />
                    </section>
                  </div>
                </div>
              </div>
            )}
            {currentView === "map" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden h-[calc(100vh-200px)]">
                <MapView
                  userLocation={location}
                  disasters={disasters}
                  theme={settings.theme}
                />
              </div>
            )}
            {currentView === "alerts" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-full mb-4">
                  <Bell className="w-12 h-12 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Pusat Peringatan
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                  Daftar peringatan dini bencana akan ditampilkan di sini. Saat
                  ini tidak ada peringatan aktif.
                </p>
              </div>
            )}
            {currentView === "settings" && (
              <SettingsView settings={settings} onSave={handleSaveSettings} />
            )}
          </div>
        </div>

        {/* AI Assistant - Floating */}
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40">
          <AIAssistant
            location={location}
            weather={weather}
            earthquakes={earthquakes}
          />
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-50">
        <BottomNavItem
          icon={LayoutDashboard}
          label="Dasbor"
          active={currentView === "dashboard"}
          onClick={() => setCurrentView("dashboard")}
        />
        <BottomNavItem
          icon={MapIcon}
          label="Peta"
          active={currentView === "map"}
          onClick={() => setCurrentView("map")}
        />
        <BottomNavItem
          icon={Bell}
          label="Peringatan"
          active={currentView === "alerts"}
          onClick={() => setCurrentView("alerts")}
        />
        <BottomNavItem
          icon={Settings}
          label="Pengaturan"
          active={currentView === "settings"}
          onClick={() => setCurrentView("settings")}
        />
      </nav>

      <EmergencyMode
        isOpen={isEmergencyMode}
        onClose={() => setIsEmergencyMode(false)}
        currentRisk={summary.status}
      />
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
  badge,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group
        ${active ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}
      `}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`w-5 h-5 ${active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
        />
        <span className="text-sm font-bold">{label}</span>
      </div>
      {badge && (
        <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black">
          {badge}
        </span>
      )}
    </button>
  );
}

function BottomNavItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 min-w-16 transition-colors ${active ? "text-blue-600" : "text-slate-400 dark:text-slate-500"}`}
    >
      <Icon
        className={`w-5 h-5 ${active ? "text-blue-600" : "text-slate-400 dark:text-slate-500"}`}
      />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
}
