# Hostinger VPS & PM2 / Nginx Deployment Guide

## Target Stack
- Hostinger Ubuntu 22.04 LTS VPS
- Node.js 20 LTS + pnpm
- PM2 Process Manager
- Nginx Reverse Proxy + Let's Encrypt SSL

## Step 1: Clone & Build Monorepo on VPS

```bash
git clone https://github.com/your-org/galaxy-tools-hub.git /var/www/galaxy-tools-hub
cd /var/www/galaxy-tools-hub
pnpm install --frozen-lockfile
pnpm build
```

## Step 2: Configure PM2 for Backend Application

Create `ecosystem.config.js` in root:

```javascript
module.exports = {
  apps: [
    {
      name: 'galaxy-server',
      script: './apps/server/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      }
    },
    {
      name: 'galaxy-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start apps/web -p 3000',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Start processes:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 3: Nginx Reverse Proxy Configuration

`/etc/nginx/sites-available/galaxytoolshub.com`:

```nginx
server {
    listen 80;
    server_name galaxytoolshub.com www.galaxytoolshub.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/v1 {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/galaxytoolshub.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d galaxytoolshub.com -d www.galaxytoolshub.com
```
