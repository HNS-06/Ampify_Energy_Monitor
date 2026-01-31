import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Activity, Thermometer, Clock } from 'lucide-react';

interface MetricsGridProps {
  current: number;
  voltage: number;
  temperature: number;
  uptime: number;
  lastUpdated: number;
  isOvercurrent: boolean;
}

export default function MetricsGrid({
  current,
  voltage,
  temperature,
  uptime,
  lastUpdated,
  isOvercurrent,
}: MetricsGridProps) {
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLastUpdated = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = () => {
    if (isOvercurrent) return 'border-red-500/50 bg-red-500/5';
    if (current > 5) return 'border-yellow-500/50 bg-yellow-500/5';
    return 'border-green-500/50 bg-green-500/5';
  };

  const metrics = [
    {
      title: 'Current',
      value: `${current.toFixed(2)} A`,
      icon: Zap,
      color: 'text-chart-1',
    },
    {
      title: 'Voltage',
      value: `${voltage.toFixed(1)} V`,
      icon: Activity,
      color: 'text-chart-2',
    },
    {
      title: 'Temperature',
      value: `${temperature.toFixed(1)} °C`,
      icon: Thermometer,
      color: 'text-chart-3',
    },
    {
      title: 'Uptime',
      value: formatUptime(uptime),
      icon: Clock,
      color: 'text-chart-4',
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Live Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className={`glass-card ${getStatusColor()}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Last updated: {formatLastUpdated(lastUpdated)}
      </div>
    </div>
  );
}
