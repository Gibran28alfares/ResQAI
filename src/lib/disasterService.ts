import { GoogleGenAI, Type } from "@google/genai";
import { Disaster, DisasterType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const fetchDisasters = async (locationName?: string): Promise<Disaster[]> => {
  try {
    const locationQuery = locationName ? `di wilayah ${locationName} dan sekitarnya di Indonesia` : "di seluruh wilayah Indonesia";
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Cari berita bencana alam terbaru ${locationQuery} yang terjadi dalam 7 hari terakhir (maksimal 1 minggu), terutama yang terjadi dalam 24 jam terakhir. 
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
                description: "earthquake, flood, landslide, volcano, weather, or other" 
              },
              title: { type: Type.STRING },
              location: { type: Type.STRING },
              time: { type: Type.NUMBER, description: "Timestamp in milliseconds" },
              description: { type: Type.STRING },
              severity: { type: Type.STRING, description: "low, medium, or high" },
              url: { type: Type.STRING }
            },
            required: ["id", "type", "title", "location", "time", "description", "severity"]
          }
        }
      }
    });

    const disasters: Disaster[] = JSON.parse(response.text);
    return disasters;
  } catch (error) {
    console.error("Error fetching disasters via Gemini Search:", error);
    return [];
  }
};
