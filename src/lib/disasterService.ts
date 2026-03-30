import { GoogleGenAI, Type } from "@google/genai";
import {
  Disaster,
  DisasterType,
  WeatherData,
  Earthquake,
  RiskStatus,
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const fetchDisasters = async (
  locationName?: string,
): Promise<Disaster[]> => {
  try {
    const locationQuery = locationName
      ? `di wilayah ${locationName} dan sekitarnya di Indonesia`
      : "di seluruh wilayah Indonesia";
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Cari berita bencana alam terbaru ${locationQuery} yang terjadi dalam 7 hari terakhir (maksimal 1 minggu), terutama yang terjadi dalam 24 jam terakhir. 
      PENTING: Hanya ambil data bencana yang terjadi di dalam wilayah kedaulatan Republik Indonesia. JANGAN sertakan data dari negara tetangga seperti Timor Leste, Malaysia, Papua Nugini, atau Australia meskipun lokasinya berdekatan.
      Cari kejadian seperti banjir, tanah longsor, erupsi gunung berapi, kebakaran hutan, dan cuaca ekstrem. 
      Berikan daftar bencana tersebut dalam format JSON yang terstruktur. 
      Pastikan 'time' adalah timestamp dalam milidetik (milliseconds) yang akurat berdasarkan waktu kejadian.
      Waktu saat ini adalah ${new Date().toISOString()}.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: {
                type: Type.STRING,
                description:
                  "earthquake, flood, landslide, volcano, weather, or other",
              },
              title: { type: Type.STRING },
              location: { type: Type.STRING },
              time: {
                type: Type.NUMBER,
                description: "Timestamp in milliseconds",
              },
              description: { type: Type.STRING },
              severity: {
                type: Type.STRING,
                description: "low, medium, or high",
              },
              url: { type: Type.STRING },
              coordinates: {
                type: Type.OBJECT,
                properties: {
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER },
                },
                required: ["lat", "lng"],
              },
            },
            required: [
              "id",
              "type",
              "title",
              "location",
              "time",
              "description",
              "severity",
              "coordinates",
            ],
          },
        },
      },
    });

    const disasters: Disaster[] = JSON.parse(response.text);
    return disasters;
  } catch (error) {
    console.error("Error fetching disasters via Gemini Search:", error);
    return [];
  }
};

export const analyzeRiskStatus = async (
  locationName: string,
  weather: WeatherData | null,
  nearbyQuakes: Earthquake[],
  nearbyDisasters: Disaster[],
): Promise<{ status: RiskStatus; message: string }> => {
  try {
    const quakeContext =
      nearbyQuakes.length > 0
        ? `Ada ${nearbyQuakes.length} gempa terdeteksi di sekitar, dengan magnitudo tertinggi M ${Math.max(...nearbyQuakes.map((q) => q.mag))}.`
        : "Tidak ada gempa signifikan di sekitar.";

    const disasterContext =
      nearbyDisasters.length > 0
        ? `Ada ${nearbyDisasters.length} laporan bencana aktif di sekitar: ${nearbyDisasters.map((d) => d.title).join(", ")}.`
        : "Tidak ada laporan bencana aktif di sekitar.";

    const weatherContext = weather
      ? `Cuaca saat ini: ${weather.temp}°C, ${weather.condition} (${weather.description}).`
      : "Data cuaca tidak tersedia.";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analisis risiko keselamatan untuk wilayah ${locationName} berdasarkan data berikut:
      1. ${quakeContext}
      2. ${disasterContext}
      3. ${weatherContext}
      
      Berikan penilaian risiko dalam format JSON:
      {
        "status": "safe" | "alert" | "danger",
        "message": "Kalimat singkat (maks 10 kata) yang merangkum situasi dan saran singkat"
      }
      
      Gunakan bahasa Indonesia yang profesional namun mudah dimengerti.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              description: "safe, alert, or danger",
            },
            message: { type: Type.STRING },
          },
          required: ["status", "message"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analyzing risk status:", error);
    return { status: "safe", message: "Kondisi Aman (Analisis Terbatas)" };
  }
};
