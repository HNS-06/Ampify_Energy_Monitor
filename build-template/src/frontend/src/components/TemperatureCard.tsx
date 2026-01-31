import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TemperatureCardProps {
  temperature: number;
}

export default function TemperatureCard({ temperature }: TemperatureCardProps) {
  const maxTemp = 100;
  const percentage = Math.min((temperature / maxTemp) * 100, 100);

  const getTemperatureColor = () => {
    if (temperature < 40) return 'text-blue-500';
    if (temperature < 60) return 'text-green-500';
    if (temperature < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColorClass = () => {
    if (temperature < 40) return '[&>div]:bg-blue-500';
    if (temperature < 60) return '[&>div]:bg-green-500';
    if (temperature < 80) return '[&>div]:bg-yellow-500';
    return '[&>div]:bg-red-500';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Thermometer className="h-5 w-5" />
          Temperature
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className={`text-5xl font-bold ${getTemperatureColor()}`}>
              {temperature.toFixed(1)}°C
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={percentage} className={`h-3 ${getProgressColorClass()}`} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0°C</span>
              <span>{maxTemp}°C</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
