import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import LiveCurrentGraph from '../components/LiveCurrentGraph';
import LoadStatusCard from '../components/LoadStatusCard';
import OvercurrentAlert from '../components/OvercurrentAlert';
import TemperatureCard from '../components/TemperatureCard';
import MetricsGrid from '../components/MetricsGrid';
import PredictionMetrics from '../components/PredictionMetrics';
import HealthScore from '../components/HealthScore';
import FailurePrediction from '../components/FailurePrediction';
import AnomalyAlerts from '../components/AnomalyAlerts';
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
          AMPIFY Energy Monitor
        </h1>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
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

      {/* Predictive Maintenance Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-chart-3 to-chart-4 bg-clip-text text-transparent">
          Predictive Maintenance
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Score */}
          <HealthScore
            score={data?.ml?.health_score || 100}
            trend={data?.ml?.trend || 0}
          />

          {/* Failure Prediction */}
          <FailurePrediction
            hoursToFailure={data?.ml?.failure_prediction?.hours_to_failure || null}
            confidence={data?.ml?.failure_prediction?.confidence || 0}
          />

          {/* Anomaly Alerts */}
          <AnomalyAlerts
            alerts={data?.ml?.alerts || []}
          />
        </div>
      </div>

      {/* Prediction Metrics */}
      <PredictionMetrics />
    </div>
  );
}
