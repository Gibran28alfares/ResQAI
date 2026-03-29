import axios from 'axios';
import { Earthquake, WeatherData } from '../types';

const USGS_BASE_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export const fetchEarthquakes = async (): Promise<Earthquake[]> => {
  try {
    const response = await axios.get(USGS_BASE_URL, {
      params: {
        format: 'geojson',
        starttime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 jam terakhir
        minlatitude: -11,
        maxlatitude: 6,
        minlongitude: 95,
        maxlongitude: 141,
      },
    });
    return response.data.features.map((feature: any) => ({
      id: feature.id,
      mag: feature.properties.mag,
      place: feature.properties.place,
      time: feature.properties.time,
      url: feature.properties.url,
      coordinates: {
        lng: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
      },
      depth: feature.geometry.coordinates[2],
    }));
  } catch (error) {
    console.error('Error fetching earthquake data:', error);
    return [];
  }
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData | null> => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('OpenWeather API key is missing. Weather data will not be available.');
    return null;
  }

  try {
    const response = await axios.get(OPENWEATHER_BASE_URL, {
      params: {
        lat,
        lon,
        appid: apiKey,
        units: 'metric',
      },
    });

    return {
      temp: response.data.main.temp,
      condition: response.data.weather[0].main,
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      locationName: response.data.name,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

export const geocodeLocation = async (query: string): Promise<{ name: string, lat: number, lon: number } | null> => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
      params: {
        q: `${query},ID`, // Limit to Indonesia for better accuracy as per app context
        limit: 1,
        appid: apiKey,
      },
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        name: result.name,
        lat: result.lat,
        lon: result.lon,
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
};
