import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  error: Error | null;
}

export default function ErrorDisplay({ error }: ErrorDisplayProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="glass-card max-w-2xl mx-auto border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Unable to connect to the ESP8266 device. Please check the following:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>ESP8266 device is powered on and connected to the network</li>
              <li>API endpoint is accessible at <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/data</code></li>
              <li>Network connection is stable</li>
              <li>CORS settings allow requests from this domain</li>
            </ul>
          </div>
          {error && (
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-xs font-mono text-destructive">{error.message}</p>
            </div>
          )}
          <Button onClick={handleRefresh} className="w-full" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
