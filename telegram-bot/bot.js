const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const backendUrl = process.env.BACKEND_API_URL;

// Create bot instance
const bot = new TelegramBot(token, { polling: true });

// Store subscribed users and their data
const subscribers = new Map(); // chatId -> { username, points, lastCheck, achievements }
const alertHistory = [];

// Gamification data
const achievements = {
    'first_check': { name: '🔍 First Check', points: 10, description: 'Checked status for the first time' },
    'quick_responder': { name: '⚡ Quick Responder', points: 50, description: 'Responded to alert within 5 minutes' },
    'failure_preventer': { name: '🛡️ Failure Preventer', points: 100, description: 'Prevented equipment failure' },
    'daily_checker': { name: '📅 Daily Checker', points: 25, description: 'Checked status daily for 7 days' },
    'alert_master': { name: '🎯 Alert Master', points: 75, description: 'Handled 10 alerts successfully' }
};

console.log('🤖 AMPIFY Telegram Bot starting...');

// ===== COMMANDS =====

// /start - Subscribe to alerts
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.from.username || msg.from.first_name || 'User';

    if (!subscribers.has(chatId)) {
        subscribers.set(chatId, {
            username,
            points: 0,
            lastCheck: null,
            achievements: [],
            alertsHandled: 0,
            joinedAt: Date.now()
        });

        bot.sendMessage(chatId,
            `🎉 Welcome to AMPIFY Monitoring, ${username}!\n\n` +
            `✅ You're now subscribed to real-time alerts.\n\n` +
            `📋 Available commands:\n` +
            `/status - Current system status\n` +
            `/health - Equipment health score\n` +
            `/alerts - Recent alerts\n` +
            `/stats - System statistics\n` +
            `/points - Your gamification points\n` +
            `/leaderboard - Top users\n` +
            `/stop - Unsubscribe\n\n` +
            `🎮 Earn points by monitoring and responding to alerts!`
        );
    } else {
        bot.sendMessage(chatId, `👋 Welcome back, ${username}! You're already subscribed.`);
    }
});

// /stop - Unsubscribe
bot.onText(/\/stop/, (msg) => {
    const chatId = msg.chat.id;

    if (subscribers.has(chatId)) {
        subscribers.delete(chatId);
        bot.sendMessage(chatId, '👋 You have been unsubscribed from alerts. Use /start to subscribe again.');
    } else {
        bot.sendMessage(chatId, 'You are not subscribed. Use /start to subscribe.');
    }
});

// /status - Get current system status
bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        const response = await axios.get(`${backendUrl}/api/data`);
        const data = response.data;

        const statusEmoji = data.overcurrent ? '🔴' : data.current > 2.3 ? '🟡' : '🟢';
        const healthEmoji = data.ml?.health_score > 80 ? '💚' : data.ml?.health_score > 50 ? '💛' : '❤️';

        const message =
            `${statusEmoji} *AMPIFY System Status*\n\n` +
            `⚡ Current: ${data.current.toFixed(2)}A\n` +
            `🔋 Voltage: ${data.voltage.toFixed(2)}V\n` +
            `🌡️ Temperature: ${data.temperature.toFixed(1)}°C\n` +
            `⏱️ Uptime: ${formatUptime(data.uptime)}\n\n` +
            `${healthEmoji} Health: ${data.ml?.health_score?.toFixed(1) || 'N/A'}%\n` +
            `${data.ml?.failure_prediction?.hours_to_failure ?
                `⏰ Maintenance in: ${data.ml.failure_prediction.hours_to_failure.toFixed(1)}h` :
                '✅ No failure predicted'}\n\n` +
            `${data.overcurrent ? '⚠️ OVERCURRENT DETECTED!' : '✅ Operating normally'}`;

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

        // Award points for checking status
        awardPoints(chatId, 10, 'first_check');

    } catch (error) {
        bot.sendMessage(chatId, '❌ Error fetching system status. Please try again.');
        console.error('Status error:', error.message);
    }
});

// /health - Get equipment health
bot.onText(/\/health/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        const response = await axios.get(`${backendUrl}/api/data`);
        const health = response.data.ml?.health_score || 100;
        const trend = response.data.ml?.trend || 0;

        const healthEmoji = health > 80 ? '💚' : health > 50 ? '💛' : '❤️';
        const trendEmoji = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';

        const message =
            `${healthEmoji} *Equipment Health Report*\n\n` +
            `Health Score: ${health.toFixed(1)}%\n` +
            `Trend: ${trendEmoji} ${trend.toFixed(2)}/min\n\n` +
            getHealthRecommendation(health);

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
        bot.sendMessage(chatId, '❌ Error fetching health data.');
    }
});

// /alerts - Get recent alerts
bot.onText(/\/alerts/, (msg) => {
    const chatId = msg.chat.id;

    if (alertHistory.length === 0) {
        bot.sendMessage(chatId, '✅ No recent alerts. System operating normally.');
        return;
    }

    const recentAlerts = alertHistory.slice(-5).reverse();
    let message = '🚨 *Recent Alerts*\n\n';

    recentAlerts.forEach((alert, index) => {
        const emoji = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️';
        const time = new Date(alert.timestamp).toLocaleTimeString();
        message += `${emoji} ${alert.message}\n   _${time}_\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// /stats - System statistics
bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        const response = await axios.get(`${backendUrl}/api/data`);
        const data = response.data;

        const message =
            `📊 *System Statistics*\n\n` +
            `📈 Total Alerts: ${alertHistory.length}\n` +
            `👥 Active Users: ${subscribers.size}\n` +
            `⏱️ System Uptime: ${formatUptime(data.uptime)}\n` +
            `🎯 ML Data Points: ${data.ml?.data_points_analyzed || 0}\n` +
            `🔍 Anomalies Detected: ${alertHistory.filter(a => a.message.includes('Anomaly')).length}`;

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error) {
        bot.sendMessage(chatId, '❌ Error fetching statistics.');
    }
});

// /points - User points and achievements
bot.onText(/\/points/, (msg) => {
    const chatId = msg.chat.id;

    if (!subscribers.has(chatId)) {
        bot.sendMessage(chatId, 'Please use /start to subscribe first.');
        return;
    }

    const user = subscribers.get(chatId);
    let message = `🎮 *Your Gamification Stats*\n\n`;
    message += `⭐ Points: ${user.points}\n`;
    message += `🏆 Achievements: ${user.achievements.length}\n`;
    message += `🎯 Alerts Handled: ${user.alertsHandled}\n\n`;

    if (user.achievements.length > 0) {
        message += `*Unlocked Achievements:*\n`;
        user.achievements.forEach(achId => {
            const ach = achievements[achId];
            message += `${ach.name} - ${ach.description}\n`;
        });
    } else {
        message += `_No achievements yet. Keep monitoring!_`;
    }

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// /leaderboard - Top users
bot.onText(/\/leaderboard/, (msg) => {
    const chatId = msg.chat.id;

    const sortedUsers = Array.from(subscribers.entries())
        .sort((a, b) => b[1].points - a[1].points)
        .slice(0, 10);

    if (sortedUsers.length === 0) {
        bot.sendMessage(chatId, 'No users on leaderboard yet.');
        return;
    }

    let message = '🏆 *Leaderboard - Top 10*\n\n';
    sortedUsers.forEach(([id, user], index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        message += `${medal} ${user.username}: ${user.points} pts\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// ===== HELPER FUNCTIONS =====

function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
}

function getHealthRecommendation(health) {
    if (health > 90) return '✅ Excellent condition. Continue regular monitoring.';
    if (health > 70) return '⚠️ Good condition. Schedule preventive maintenance soon.';
    if (health > 50) return '🔶 Degraded condition. Maintenance recommended within 24 hours.';
    return '🔴 Critical condition! Immediate maintenance required!';
}

function awardPoints(chatId, points, achievementId) {
    if (!subscribers.has(chatId)) return;

    const user = subscribers.get(chatId);
    user.points += points;

    // Check for new achievement
    if (achievementId && !user.achievements.includes(achievementId)) {
        user.achievements.push(achievementId);
        const ach = achievements[achievementId];
        bot.sendMessage(chatId,
            `🎉 *Achievement Unlocked!*\n\n` +
            `${ach.name}\n` +
            `${ach.description}\n` +
            `+${ach.points} points!`,
            { parse_mode: 'Markdown' }
        );
    }
}

// ===== ALERT BROADCASTING =====

function broadcastAlert(alert) {
    alertHistory.push(alert);

    // Keep only last 100 alerts
    if (alertHistory.length > 100) {
        alertHistory.shift();
    }

    const emoji = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : 'ℹ️';
    const message = `${emoji} *ALERT*\n\n${alert.message}\n\n_${new Date(alert.timestamp).toLocaleString()}_`;

    // Send to all subscribers
    subscribers.forEach((user, chatId) => {
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
            .catch(err => console.error(`Failed to send to ${chatId}:`, err.message));

        // Award points for quick response (if they check status within 5 min)
        user.alertsHandled++;
        if (user.alertsHandled >= 10) {
            awardPoints(chatId, 0, 'alert_master');
        }
    });
}

// ===== HTTP ENDPOINT FOR BACKEND INTEGRATION =====

const app = express();
app.use(express.json());

// Endpoint for backend to send alerts
app.post('/alert', (req, res) => {
    const alert = req.body;
    broadcastAlert(alert);
    res.json({ success: true, subscribers: subscribers.size });
});

// Endpoint to get subscriber count
app.get('/subscribers', (req, res) => {
    res.json({ count: subscribers.size });
});

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`✅ Telegram bot HTTP server running on port ${PORT}`);
    console.log(`✅ Bot is polling for messages`);
    console.log(`📱 Bot username: @Amipifymonitor_bot`);
});

// Error handling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error.message);
});

console.log('🚀 AMPIFY Telegram Bot is ready!');
