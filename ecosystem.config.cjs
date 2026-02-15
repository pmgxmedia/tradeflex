// PM2 Process Manager Configuration
// This file is used to manage your Node.js application with PM2
// Usage: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: 'estore-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1, // Use 'max' to use all CPU cores, or set to number of instances
      exec_mode: 'cluster', // Use cluster mode for better performance
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      watch: false, // Set to true if you want auto-restart on file changes
      ignore_watch: ['node_modules', 'logs'],
      // Restart settings
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      // Advanced settings
      kill_timeout: 5000,
      wait_ready: false,
      // Auto-restart on crash
      autorestart: true,
      // Environment-specific configuration
      env_production: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],

  // Deployment configuration (optional - for PM2 deploy feature)
  deploy: {
    production: {
      user: 'YOUR_SSH_USER',
      host: 'tradeflex.online',
      ref: 'origin/main',
      repo: 'git@github.com:YOUR_USERNAME/YOUR_REPO.git',
      path: '/var/www/tradeflex',
      'post-deploy':
        'cd estore/backend && npm install && pm2 reload ecosystem.config.cjs --env production',
    },
  },
};
