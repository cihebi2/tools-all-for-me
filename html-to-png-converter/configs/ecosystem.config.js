module.exports = {
  apps: [{
    name: 'html-to-png-converter',
    script: 'server_enhanced.js',
    instances: 1,
    autorestart: true,
    watch: true,
    ignore_watch: ['node_modules', 'uploads', 'logs', '*.log'],
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3003,
      MAX_BROWSERS: 3,
      TIMEOUT: 60000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3003,
      MAX_BROWSERS: 2,
      TIMEOUT: 30000
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
};