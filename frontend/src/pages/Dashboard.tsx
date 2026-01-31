import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import LiveCurrentGraph from '../components/LiveCurrentGraph';
import LoadStatusCard from '../components/LoadStatusCard';
import OvercurrentAlert from '../components/OvercurrentAlert';
import TemperatureCard from '../components/TemperatureCard';
import MetricsGrid from '../components/MetricsGrid';
import PredictionMetrics from '../components/PredictionMetrics';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';
import { useESP8266Data } from '../hooks/useESP8266Data';

export default function Dashboard() {
  const { data, isLoading, isError, error, isConnected } = useESP8266Data();
  const [showOvercurrentAlert, setShowOvercurrentAlert] = useState(false);

  useEffect(() => {
    if (data?.overcurrent && !showOvercurrentAlert) {
      setShowOvercurrentAlert(true);
      toast.error('Overcurrent Detected!', {
        description: 'The system has detected an overcurrent condition.',
        duration: 5000,
      });
    } else if (!data?.overcurrent && showOvercurrentAlert) {
      setShowOvercurrentAlert(false);
    }
  }, [data?.overcurrent, showOvercurrentAlert]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Connection Status Banner */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-chart-1 to-chart-2 bg-clip-text text-transparent">
          Energy Monitoring Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Overcurrent Alert */}
      {showOvercurrentAlert && <OvercurrentAlert />}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Load Status & Temperature */}
        <div className="space-y-6">
          <LoadStatusCard isLoadOn={data?.load || false} />
          <TemperatureCard temperature={data?.temperature || 0} />
        </div>

        {/* Middle Column - Live Graph */}
        <div className="lg:col-span-2">
          <LiveCurrentGraph />
        </div>
      </div>

      {/* Metrics Grid */}
      <MetricsGrid
        current={data?.current || 0}
        voltage={data?.voltage || 0}
        temperature={data?.temperature || 0}
        uptime={data?.uptime || 0}
        lastUpdated={data?.timestamp || Date.now()}
        isOvercurrent={data?.overcurrent || false}
      />

      {/* Prediction Metrics */}
      <PredictionMetrics />
    </div>
  );
}
