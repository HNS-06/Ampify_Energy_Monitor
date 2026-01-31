from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import IsolationForest
import numpy as np
from collections import deque
from datetime import datetime, timedelta
import pandas as pd

app = Flask(__name__)
CORS(app)

# In-memory storage for historical data
data_history = deque(maxlen=1000)
anomaly_model = None
alert_history = deque(maxlen=100)

# Initialize Isolation Forest model
def init_model():
    global anomaly_model
    anomaly_model = IsolationForest(
        contamination=0.1,  # 10% expected anomalies
        random_state=42,
        n_estimators=100
    )

init_model()

def calculate_health_score(current, voltage, temperature, is_anomaly):
    """Calculate equipment health score (0-100)"""
    score = 100.0
    
    # Voltage deviation penalty (ideal: 5.0V)
    voltage_deviation = abs(voltage - 5.0) / 5.0
    score -= voltage_deviation * 20
    
    # Current overload penalty (threshold: 2.4A)
    if current > 2.4:
        score -= (current - 2.4) * 15
    
    # Temperature penalty (ideal: 25-27°C)
    if temperature > 27.5:
        score -= (temperature - 27.5) * 5
    elif temperature < 25.0:
        score -= (25.0 - temperature) * 3
    
    # Anomaly penalty
    if is_anomaly:
        score -= 25
    
    return max(0, min(100, score))

def predict_failure_time(health_score, trend):
    """Estimate time to failure based on health score and trend"""
    if health_score > 80:
        return None  # Healthy, no failure predicted
    
    # Simple linear extrapolation
    if trend < -0.5:  # Declining health
        hours_to_failure = (health_score / abs(trend)) * 0.5
        return min(48, max(2, hours_to_failure))  # Clamp between 2-48 hours
    
    return None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model_ready': anomaly_model is not None})

@app.route('/analyze', methods=['POST'])
def analyze_data():
    """Analyze sensor data for anomalies and calculate health score"""
    try:
        data = request.json
        current = data.get('current', 0)
        voltage = data.get('voltage', 5.0)
        temperature = data.get('temperature', 25.0)
        timestamp = data.get('timestamp', datetime.now().timestamp() * 1000)
        
        # Store in history
        data_point = {
            'current': current,
            'voltage': voltage,
            'temperature': temperature,
            'timestamp': timestamp
        }
        data_history.append(data_point)
        
        # Anomaly detection
        is_anomaly = False
        anomaly_score = 0
        
        if len(data_history) >= 10:
            # Prepare features for anomaly detection
            features = np.array([[current, voltage, temperature]])
            
            # Train model periodically
            if len(data_history) >= 50 and len(data_history) % 20 == 0:
                historical_features = np.array([
                    [d['current'], d['voltage'], d['temperature']] 
                    for d in list(data_history)[-100:]
                ])
                anomaly_model.fit(historical_features)
            
            # Predict anomaly
            prediction = anomaly_model.predict(features)
            anomaly_score = anomaly_model.score_samples(features)[0]
            is_anomaly = prediction[0] == -1
        
        # Calculate health score
        health_score = calculate_health_score(current, voltage, temperature, is_anomaly)
        
        # Calculate trend (last 10 data points)
        trend = 0
        if len(data_history) >= 10:
            recent_scores = []
            for d in list(data_history)[-10:]:
                temp_anomaly = False  # Simplified for trend
                temp_score = calculate_health_score(
                    d['current'], d['voltage'], d['temperature'], temp_anomaly
                )
                recent_scores.append(temp_score)
            
            # Linear regression for trend
            x = np.arange(len(recent_scores))
            trend = np.polyfit(x, recent_scores, 1)[0]
        
        # Predict failure
        failure_time = predict_failure_time(health_score, trend)
        
        # Generate alerts
        alerts = []
        if is_anomaly:
            alert = {
                'severity': 'warning',
                'message': f'Anomaly detected: Current={current:.2f}A, Voltage={voltage:.2f}V',
                'timestamp': timestamp
            }
            alerts.append(alert)
            alert_history.append(alert)
        
        if health_score < 50:
            alert = {
                'severity': 'critical',
                'message': f'Critical health score: {health_score:.1f}%',
                'timestamp': timestamp
            }
            alerts.append(alert)
            alert_history.append(alert)
        
        if failure_time and failure_time < 24:
            alert = {
                'severity': 'critical',
                'message': f'Failure predicted in {failure_time:.1f} hours',
                'timestamp': timestamp
            }
            alerts.append(alert)
            alert_history.append(alert)
        
        return jsonify({
            'health_score': round(health_score, 1),
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': float(anomaly_score),
            'trend': float(trend),
            'failure_prediction': {
                'hours_to_failure': failure_time,
                'confidence': 0.75 if failure_time else 0
            },
            'alerts': alerts,
            'data_points_analyzed': len(data_history)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/alerts', methods=['GET'])
def get_alerts():
    """Get recent alert history"""
    return jsonify({
        'alerts': list(alert_history)[-20:]  # Last 20 alerts
    })

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get system statistics"""
    if len(data_history) == 0:
        return jsonify({'error': 'No data available'}), 404
    
    recent_data = list(data_history)[-100:]
    currents = [d['current'] for d in recent_data]
    voltages = [d['voltage'] for d in recent_data]
    temps = [d['temperature'] for d in recent_data]
    
    return jsonify({
        'data_points': len(data_history),
        'statistics': {
            'current': {
                'mean': float(np.mean(currents)),
                'std': float(np.std(currents)),
                'min': float(np.min(currents)),
                'max': float(np.max(currents))
            },
            'voltage': {
                'mean': float(np.mean(voltages)),
                'std': float(np.std(voltages)),
                'min': float(np.min(voltages)),
                'max': float(np.max(voltages))
            },
            'temperature': {
                'mean': float(np.mean(temps)),
                'std': float(np.std(temps)),
                'min': float(np.min(temps)),
                'max': float(np.max(temps))
            }
        }
    })

if __name__ == '__main__':
    print("🤖 ML Service starting on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
