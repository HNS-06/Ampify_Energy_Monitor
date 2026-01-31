import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function OvercurrentAlert() {
  return (
    <Alert variant="destructive" className="animate-shake border-2 shadow-lg shadow-destructive/20">
      <AlertTriangle className="h-5 w-5 animate-pulse" />
      <AlertTitle className="text-lg font-bold">Overcurrent Detected!</AlertTitle>
      <AlertDescription>
        The system has detected an overcurrent condition. Please check your electrical connections
        immediately.
      </AlertDescription>
    </Alert>
  );
}
