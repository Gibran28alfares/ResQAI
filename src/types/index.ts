export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Earthquake {
  id: string;
  mag: number;
  place: string;
  time: number;
  url: string;
  coordinates: Coordinates;
  depth: number;
}

export interface WeatherData {
  temp: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  locationName: string;
}

export type RiskStatus = 'safe' | 'alert' | 'danger';
export type DisasterType = 'earthquake' | 'flood' | 'landslide' | 'volcano' | 'weather' | 'other';

export interface Disaster {
  id: string;
  type: DisasterType;
  title: string;
  location: string;
  time: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  url?: string;
  coordinates?: Coordinates;
}

export interface DisasterSummary {
  status: RiskStatus;
  message: string;
  recentEarthquakesCount: number;
  maxMagnitude: number;
  activeDisastersCount: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  locationMode: 'gps' | 'manual';
  manualLocation?: {
    name: string;
    coordinates: Coordinates;
  };
  notifications: boolean;
  radius: number;
}
