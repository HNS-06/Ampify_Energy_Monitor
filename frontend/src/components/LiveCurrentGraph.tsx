import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { useESP8266Data } from '../hooks/useESP8266Data';

export default function LiveCurrentGraph() {
  const { currentHistory } = useESP8266Data();
  const [chartData, setChartData] = useState<Array<{ time: string; current: number }>>([]);

  useEffect(() => {
    if (currentHistory.length > 0) {
      const formatted = currentHistory.map((point, index) => ({
        time: `${index}`,
        current: point.value,
      }));
      setChartData(formatted);
    }
  }, [currentHistory]);

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-chart-1" />
          Live Current Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(var(--chart-1))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="oklch(var(--chart-1))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="time"
                stroke="oklch(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                stroke="oklch(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickLine={false}
                label={{ value: 'Current (A)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(var(--popover))',
                  border: '1px solid oklch(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'oklch(var(--foreground))' }}
              />
              <Line
                type="monotone"
                dataKey="current"
                stroke="oklch(var(--chart-1))"
                strokeWidth={3}
                dot={false}
                fill="url(#currentGradient)"
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
