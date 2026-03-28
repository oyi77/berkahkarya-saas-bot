module.exports = {
  apps: [
    {
      name: 'berkahkarya-saas-bot',
      script: 'npm',
      args: 'run start:prod',
      cwd: '/mnt/data/openclaw/projects/openclaw-saas-bot',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
      },
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/home/openclaw/.pm2/logs/berkahkarya-saas-bot-error.log',
      out_file: '/home/openclaw/.pm2/logs/berkahkarya-saas-bot-out.log',
    },
  ],
};
