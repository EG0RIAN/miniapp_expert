Dockerized setup
================

Services:
- nginx (serves ./site and proxies /api → api:3001, /_/ → pocketbase:8090)
- api (Node.js Express)
- pocketbase (DB + admin UI)

Prerequisites:
- Docker + Docker Compose

Environment (.env in repo root):
```
TBANK_TERMINAL_KEY=1760898345949DEMO
TBANK_PASSWORD=...
WEBHOOK_SECRET=supersecretwebhookkey
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=changeme
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeMeStrong123
CORS_ORIGIN=https://miniapp.expert
API_BASE_URL=https://miniapp.expert
FRONTEND_BASE_URL=https://miniapp.expert
```

Run:
```
docker compose up -d --build
```

Access:
- Site: http://localhost (or your domain → bind 80/443 + certs mounted from host)
- PocketBase admin: http://localhost/_/
- API health: http://localhost/api/health

Notes:
- Nginx config is read from api/miniapp.expert.nginx and mounted into container.
- For TLS, mount /etc/letsencrypt from host with valid certs, or adjust compose to use plain 80.
- To import pb_schema.json, open PocketBase admin UI and import collections.


