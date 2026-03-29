import { GoogleGenAI } from "@google/genai";
import { Earthquake, WeatherData, Coordinates } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Calculates the distance between two coordinates in km
 */
function getDistance(c1: Coordinates, c2: Coordinates): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (c2.lat - c1.lat) * (Math.PI / 180);
  const dLon = (c2.lng - c1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(c1.lat * (Math.PI / 180)) *
      Math.cos(c2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const generateDisasterAdvice = async (
  location: Coordinates | null,
  weather: WeatherData | null,
  earthquakes: Earthquake[]
): Promise<string> => {
  if (!location) return "Harap aktifkan akses lokasi untuk menerima saran bencana AI yang spesifik.";

  // Filter earthquakes within 200km
  const nearbyQuakes = earthquakes
    .map((q) => ({ ...q, distance: getDistance(location, q.coordinates) }))
    .filter((q) => q.distance <= 200)
    .sort((a, b) => a.distance - b.distance);

  const weatherContext = weather 
    ? `Weather: ${weather.temp}°C, ${weather.condition} (${weather.description}). Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed}m/s.`
    : "Weather data unavailable.";

  const quakeContext = nearbyQuakes.length > 0
    ? `Nearby Earthquakes (last 24h): ${nearbyQuakes.map(q => `M${q.mag} at ${q.distance.toFixed(1)}km away (${q.place})`).join("; ")}`
    : "No significant earthquakes detected within 200km in the last 24h.";

  const prompt = `
    Waktu Sekarang: ${new Date().toLocaleString('id-ID')}
    Lokasi Pengguna: ${location.lat}, ${location.lng}
    ${weatherContext}
    ${quakeContext}

    Berdasarkan data ini, berikan saran kesiapsiagaan bencana yang singkat, dapat ditindaklanjuti, dan spesifik dalam Bahasa Indonesia. 
    - Mulailah dengan sapaan singkat seperti "Selamat pagi/siang/sore/malam" berdasarkan waktu saat ini.
    - Jika ada hujan lebat atau kelembapan tinggi, sebutkan risiko banjir atau tanah longsor.
    - Jika ada gempa bumi di dekatnya, sebutkan keselamatan gempa susulan.
    - Jika kondisi aman, berikan pesan singkat "Semua Aman" dengan satu tips untuk kesiapan umum.
    - Jaga agar tetap di bawah 3 kalimat. Bersikaplah praktis dan mendesak jika diperlukan.
    - WAJIB MENGGUNAKAN BAHASA INDONESIA.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah ResQAI, asisten tanggap bencana profesional di Indonesia. Anda memberikan saran keselamatan yang tepat, terlokalisasi, dan dapat ditindaklanjuti berdasarkan data lingkungan real-time. Hindari basa-basi yang tidak perlu. Fokus pada langkah-langkah kelangsungan hidup dan persiapan segera. Selalu merespons dalam Bahasa Indonesia.",
      },
    });

    return response.text || "Tidak dapat menghasilkan saran saat ini. Tetap waspada dan ikuti otoritas setempat.";
  } catch (error) {
    console.error("AI Advice Error:", error);
    return "Asisten AI saat ini sedang offline. Harap pantau dasbor untuk pembaruan data mentah.";
  }
};
