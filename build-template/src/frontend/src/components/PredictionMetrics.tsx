import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PredictionMetrics() {
  // Mock prediction data with varying values
  const [predictionData, setPredictionData] = useState({
    accuracy: 94.5,
    precision: 92.3,
    recall: 96.8,
    leadTime: 15.2,
    falseAlarmRate: 3.5,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPredictionData(prev => ({
        accuracy: Number((prev.accuracy + (Math.random() - 0.5) * 0.4).toFixed(1)),
        precision: Number((prev.precision + (Math.random() - 0.5) * 0.4).toFixed(1)),
        recall: Number((prev.recall + (Math.random() - 0.5) * 0.3).toFixed(1)),
        leadTime: Number((prev.leadTime + (Math.random() - 0.5) * 0.2).toFixed(1)),
        falseAlarmRate: Number((prev.falseAlarmRate + (Math.random() - 0.5) * 0.2).toFixed(1)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Predictive Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Prediction Accuracy */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-chart-1" />
              Prediction Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-chart-1">{predictionData.accuracy}%</div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Precision</span>
                <span className="font-medium">{predictionData.precision}%</span>
              </div>
              <Progress value={predictionData.precision} className="h-2" />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Recall</span>
                <span className="font-medium">{predictionData.recall}%</span>
              </div>
              <Progress value={predictionData.recall} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Lead Time */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-chart-2" />
              Failure Lead Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-chart-2">{predictionData.leadTime}s</div>
            <p className="text-xs text-muted-foreground">
              Average time before predicted failure events
            </p>
            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Early warning system active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* False Alarm Rate */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-chart-3" />
              False Alarm Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-chart-3">{predictionData.falseAlarmRate}%</div>
            <p className="text-xs text-muted-foreground">
              Percentage of false positive predictions
            </p>
            <div className="pt-2">
              <Progress value={100 - predictionData.falseAlarmRate} className="h-2" />
              <div className="mt-1 text-xs text-muted-foreground">
                {(100 - predictionData.falseAlarmRate).toFixed(1)}% reliability
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
