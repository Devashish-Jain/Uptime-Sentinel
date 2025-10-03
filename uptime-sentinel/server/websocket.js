const WebSocket = require('ws');

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map();
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, request) => {
      const clientId = this.generateClientId();
      console.log(`📡 WebSocket client connected: ${clientId}`);
      
      // Store client
      this.clients.set(clientId, {
        ws,
        subscriptions: new Set(),
        lastPing: Date.now()
      });

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        console.log(`❌ WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      // Send initial connection message
      this.sendToClient(clientId, 'connected', { clientId });
    });

    // Setup ping interval to keep connections alive
    setInterval(() => {
      this.pingClients();
    }, 30000);

    console.log('🚀 WebSocket server initialized');
  }

  generateClientId() {
    return Math.random().toString(36).substr(2, 9);
  }

  handleMessage(clientId, message) {
    const { type, payload } = message;
    console.log(`📨 WebSocket message from ${clientId}:`, { type, payload });

    switch (type) {
      case 'subscribe':
        this.handleSubscription(clientId, payload.channel, true);
        break;
      case 'unsubscribe':
        this.handleSubscription(clientId, payload.channel, false);
        break;
      case 'ping':
        this.sendToClient(clientId, 'pong', { timestamp: Date.now() });
        break;
      default:
        console.warn(`Unknown message type: ${type}`);
    }
  }

  handleSubscription(clientId, channel, subscribe) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (subscribe) {
      client.subscriptions.add(channel);
      console.log(`✅ Client ${clientId} subscribed to ${channel}`);
    } else {
      client.subscriptions.delete(channel);
      console.log(`❌ Client ${clientId} unsubscribed from ${channel}`);
    }
  }

  sendToClient(clientId, type, payload = {}) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      client.ws.send(message);
    }
  }

  broadcast(channel, type, payload = {}) {
    const message = JSON.stringify({ type, payload });
    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`📡 Broadcasted ${type} to ${sentCount} clients on channel ${channel}`);
    }
  }

  pingClients() {
    const now = Date.now();
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
        client.lastPing = now;
      } else {
        this.clients.delete(clientId);
      }
    });
  }

  // Specific methods for different types of updates
  broadcastWebsiteUpdate(website) {
    this.broadcast('website-updates', 'website-update', { website });
  }

  broadcastStatsUpdate(stats) {
    this.broadcast('dashboard-stats', 'stats-update', stats);
  }

  broadcastSystemStatus(status) {
    this.broadcast('system-status', 'system-update', status);
  }

  getConnectionCount() {
    return this.clients.size;
  }

  getSubscriptionStats() {
    const stats = {};
    this.clients.forEach(client => {
      client.subscriptions.forEach(channel => {
        stats[channel] = (stats[channel] || 0) + 1;
      });
    });
    return stats;
  }
}

// Create singleton instance
const websocketManager = new WebSocketManager();

module.exports = websocketManager;
