# [002] Setup Frontend Structure

**Issue #2 | Status: CLOSED**

## Context
Baca `docs/ARCHITECTURE.md` terlebih dahulu untuk memahami arsitektur aplikasi secara keseluruhan.

## Goal
Buat struktur folder dan file dasar untuk frontend React dengan Vite.

## Steps

### 1. Buat folder structure
Buat struktur berikut di dalam folder `frontend/`:

```
frontend/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ main.jsx
â”‚   â”œâ”€â”€ App.jsx
â”‚   â”œâ”€â”€ pages/
â”‚   â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ api/
â”‚   â””â”€â”€ store/
â”œâ”€â”€ public/
â”œâ”€â”€ Dockerfile
â”œâ”€â”€ Dockerfile.dev
â”œâ”€â”€ nginx.conf
â””â”€â”€ package.json
```

### 2. File package.json
Isi dependencies:
```json
{
  "name": "config-vault-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "axios": "^1.7.7",
    "zustand": "^4.5.5",
    "@tanstack/react-table": "^8.20.5",
    "react-diff-viewer": "^3.1.1",
    "react-hook-form": "^7.53.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.1"
  }
}
```

### 3. File vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
```

### 4. File index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Config Vault</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 5. File src/main.jsx
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 6. File src/App.jsx
```jsx
function App() {
  return (
    <div>
      <h1>Config Vault</h1>
    </div>
  )
}

export default App
```

### 7. File nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 8. Buat Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 9. Buat Dockerfile.dev
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

## Verification
- [ ] Jalankan `cd frontend && npm install`
- [ ] Jalankan `npm run dev`
- [ ] Akses `http://localhost:5173` â€” harus ada tulisan "Config Vault"

## Depends on
None (bisa dieksekusi paralel dengan issue #1)
