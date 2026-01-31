import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertTriangle } from 'lucide-react';

interface FailurePredictionProps {
    hoursToFailure: number | null;
    confidence: number;
}

export default function FailurePrediction({ hoursToFailure, confidence }: FailurePredictionProps) {
    if (!hoursToFailure) {
        return (
            <Card className="glass-card border-green-500/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-green-500" />
                        Failure Prediction
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <p className="text-lg font-semibold text-green-500">No Failure Predicted</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Equipment operating normally
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getSeverityColor = () => {
        if (hoursToFailure < 6) return 'red';
        if (hoursToFailure < 24) return 'yellow';
        return 'orange';
    };

    const color = getSeverityColor();

    return (
        <Card className={`glass-card border-${color}-500/50 bg-${color}-500/5`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 text-${color}-500`} />
                    Failure Prediction
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                    <div className={`text-4xl font-bold text-${color}-500`}>
                        {hoursToFailure.toFixed(1)}h
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Estimated time to failure
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-medium">{(confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div
                            className={`bg-${color}-500 h-2 rounded-full transition-all`}
                            style={{ width: `${confidence * 100}%` }}
                        />
                    </div>
                </div>

                <div className={`text-xs text-${color}-600 dark:text-${color}-400 bg-${color}-500/10 p-3 rounded-lg`}>
                    <p className="font-medium">⚠️ Recommended Actions:</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                        <li>Schedule maintenance inspection</li>
                        <li>Monitor sensor readings closely</li>
                        <li>Prepare replacement parts</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
