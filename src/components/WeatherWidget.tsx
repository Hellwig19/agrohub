import { useWeather, getWeatherIcon, getWeatherDesc } from "@/hooks/use-weather";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";
import { Droplets, Wind, Thermometer, CloudRain } from "lucide-react";

interface WeatherWidgetProps {
  lat: number;
  lng: number;
}

export function WeatherWidget({ lat, lng }: WeatherWidgetProps) {
  const { data: weather, isLoading, error } = useWeather(lat, lng);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
      </Card>
    );
  }

  if (error || !weather) {
    return null;
  }

  const IconComponent = Icons[getWeatherIcon(weather.current.weatherCode)];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="flex flex-1 items-center gap-4 bg-primary/5 p-6">
          <div className="rounded-full bg-white p-3 shadow-sm dark:bg-zinc-900">
            <IconComponent className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Condições no Campo
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{weather.current.temp}°C</span>
              <span className="text-sm font-medium text-foreground">
                {getWeatherDesc(weather.current.weatherCode)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-4 border-t p-6 md:border-l md:border-t-0">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs">
              <p className="text-muted-foreground">Vento</p>
              <p className="font-semibold">{weather.current.windSpeed} km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs">
              <p className="text-muted-foreground">Umidade</p>
              <p className="font-semibold">{weather.current.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs">
              <p className="text-muted-foreground">Precipitação</p>
              <p className="font-semibold">{weather.current.precipitation} mm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs">
              <p className="text-muted-foreground">Máx / Mín</p>
              <p className="font-semibold">
                {Math.round(weather.daily.tempMax[0] ?? 0)}° /{" "}
                {Math.round(weather.daily.tempMin[0] ?? 0)}°
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
