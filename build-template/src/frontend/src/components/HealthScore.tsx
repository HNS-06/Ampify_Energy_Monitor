import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Heart, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface HealthScoreProps {
    score: number;
    trend: number;
}

export default function HealthScore({ score, trend }: HealthScoreProps) {
    const getHealthColor = () => {
        if (score >= 80) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getHealthStatus = () => {
        if (score >= 80) return 'Excellent';
        if (score >= 50) return 'Fair';
        return 'Critical';
    };

    const getTrendIcon = () => {
        if (trend > 0.5) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (trend < -0.5) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-gray-500" />;
    };

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className={`h-5 w-5 ${getHealthColor()}`} />
                    Equipment Health
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-muted opacity-20"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 56}`}
                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                                className={getHealthColor()}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-bold ${getHealthColor()}`}>
                                {score.toFixed(0)}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {getHealthStatus()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trend</span>
                        <span className="flex items-center gap-1">
                            {getTrendIcon()}
                            {trend > 0 ? '+' : ''}{trend.toFixed(2)}/min
                        </span>
                    </div>
                    <Progress value={score} className="h-2" />
                </div>
            </CardContent>
        </Card>
    );
}
