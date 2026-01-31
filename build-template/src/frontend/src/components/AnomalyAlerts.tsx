import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

interface Alert {
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: number;
}

interface AnomalyAlertsProps {
    alerts: Alert[];
}

export default function AnomalyAlerts({ alerts }: AnomalyAlertsProps) {
    const [dismissed, setDismissed] = useState<Set<number>>(new Set());

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'red';
            case 'warning': return 'yellow';
            default: return 'blue';
        }
    };

    const getSeverityIcon = (severity: string) => {
        const color = getSeverityColor(severity);
        return <AlertCircle className={`h-4 w-4 text-${color}-500`} />;
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    const handleDismiss = (timestamp: number) => {
        setDismissed(prev => new Set(prev).add(timestamp));
    };

    const activeAlerts = alerts.filter(alert => !dismissed.has(alert.timestamp));

    if (activeAlerts.length === 0) {
        return (
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-green-500" />
                        System Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No active alerts
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    System Alerts ({activeAlerts.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activeAlerts.map((alert, index) => {
                        const color = getSeverityColor(alert.severity);
                        return (
                            <div
                                key={`${alert.timestamp}-${index}`}
                                className={`flex items-start gap-3 p-3 rounded-lg border border-${color}-500/30 bg-${color}-500/5`}
                            >
                                {getSeverityIcon(alert.severity)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{alert.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatTime(alert.timestamp)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDismiss(alert.timestamp)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
