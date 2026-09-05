const mongoose = require('mongoose');
const { successResponse } = require('../utils/apiResponse');

const checkHealth = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';

  const healthData = {
    appName: 'IronForge Gym Management System API',
    version: '1.0.0',
    status: 'online',
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: dbStatus,
      host: mongoose.connection.host || 'none',
      name: mongoose.connection.name || 'none',
    },
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  };

  return successResponse(res, 'Gym Management System API is operating normally.', healthData);
};

module.exports = {
  checkHealth,
};
