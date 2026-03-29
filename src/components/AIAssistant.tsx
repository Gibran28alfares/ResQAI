import React, { useState } from "react";
import { Bot, Sparkles, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateDisasterAdvice } from "../lib/gemini";
import { Earthquake, WeatherData, Coordinates } from "../types";

interface AIAssistantProps {
  location: Coordinates | null;
  weather: WeatherData | null;
  earthquakes: Earthquake[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  location,
  weather,
  earthquakes,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const handleGetAdvice = async () => {
    setLoading(true);
    setScanning(true);

    // Artificial delay to show "Scanning" phase for better UX feel
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setScanning(false);

    const result = await generateDisasterAdvice(location, weather, earthquakes);
    setAdvice(result);
    setLoading(false);
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-[320px] sm:w-95 bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-2xl overflow-hidden z-50"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-sm uppercase tracking-widest">
                    Asisten ResQAI
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {!advice ? (
                  <motion.div
                    key="initial"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                      Dapatkan saran keselamatan yang dipersonalisasi
                      berdasarkan lokasi Anda saat ini dan data lingkungan
                      real-time.
                    </p>
                    <button
                      onClick={handleGetAdvice}
                      disabled={loading}
                      className="w-full py-3 bg-white text-blue-700 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors shadow-lg disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {scanning
                            ? "Memindai Lingkungan..."
                            : "Menganalisis Data..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Cek Risiko Saya
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="advice"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl max-h-75 overflow-y-auto custom-scrollbar">
                      <p className="text-sm leading-relaxed font-medium italic">
                        "{advice}"
                      </p>
                    </div>
                    <button
                      onClick={handleGetAdvice}
                      disabled={loading}
                      className="text-[10px] font-bold uppercase tracking-widest text-blue-200 hover:text-white transition-colors flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                      />
                      Perbarui Saran
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${
          isOpen ? "bg-white text-blue-600" : "bg-blue-600 text-white"
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
          </span>
        )}
      </button>
    </div>
  );
};

// Helper for the refresh icon which was missing from imports in the thought process but needed
import { RefreshCw, X } from "lucide-react";

export default AIAssistant;
