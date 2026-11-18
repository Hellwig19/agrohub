import { useQuery } from "@tanstack/react-query";

export interface WeatherData {
  current: {
    temp: number;
    windSpeed: number;
    humidity: number;
    weatherCode: number;
    precipitation: number;
  };
  daily: {
    time: string[];
    weatherCode: number[];
    tempMax: number[];
    tempMin: number[];
    precipSum: number[];
  };
}

export function useWeather(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ["weather", lat, lng],
    enabled: lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng),
    queryFn: async (): Promise<WeatherData> => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Não foi possível consultar a previsão do tempo.");
      const data = await res.json();

      return {
        current: {
          temp: data.current.temperature_2m,
          windSpeed: data.current.wind_speed_10m,
          humidity: data.current.relative_humidity_2m,
          weatherCode: data.current.weather_code,
          precipitation: data.current.precipitation,
        },
        daily: {
          time: data.daily.time,
          weatherCode: data.daily.weather_code,
          tempMax: data.daily.temperature_2m_max,
          tempMin: data.daily.temperature_2m_min,
          precipSum: data.daily.precipitation_sum,
        },
      };
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function getWeatherIcon(code: number) {
  if (code === 0) return "Sun";
  if (code >= 1 && code <= 3) return "CloudSun";
  if (code >= 45 && code <= 48) return "CloudFog";
  if (code >= 51 && code <= 67) return "CloudRain";
  if (code >= 71 && code <= 77) return "Snowflake";
  if (code >= 80 && code <= 82) return "CloudRainWind";
  if (code >= 95) return "CloudLightning";
  return "Cloud";
}

export function getWeatherDesc(code: number) {
  const mapping: Record<number, string> = {
    0: "Céu limpo",
    1: "Predomínio de sol",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Nevoeiro",
    48: "Nevoeiro com geada",
    51: "Driza leve",
    61: "Chuva fraca",
    63: "Chuva moderada",
    80: "Pancadas de chuva",
    95: "Trovoada",
  };
  return mapping[code] || "Estável";
}
