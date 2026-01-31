import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Power } from 'lucide-react';

interface LoadStatusCardProps {
  isLoadOn: boolean;
}

export default function LoadStatusCard({ isLoadOn }: LoadStatusCardProps) {
  return (
    <Card
      className={`glass-card transition-all duration-500 ${
        isLoadOn
          ? 'border-green-500/50 bg-green-500/5 shadow-lg shadow-green-500/20'
          : 'border-border bg-muted/20'
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Power className="h-5 w-5" />
          Load Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4 py-6">
          <div
            className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-500 ${
              isLoadOn
                ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse'
                : 'bg-muted'
            }`}
          >
            <Power className={`h-12 w-12 ${isLoadOn ? 'text-white' : 'text-muted-foreground'}`} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{isLoadOn ? 'ON' : 'OFF'}</p>
            <p className="text-sm text-muted-foreground">
              {isLoadOn ? 'Load is active' : 'Load is inactive'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
