#!/bin/sh
set -e

echo "Waiting for database..."
for i in $(seq 1 30); do
  if node -e "const net=require('net');const s=net.createConnection({host:'db',port:5432});s.on('connect',()=>{s.end();process.exit(0)});s.on('error',()=>process.exit(1))" 2>/dev/null; then
    echo "Database is ready."
    break
  fi
  echo "Retrying... ($i/30)"
  sleep 2
done

# If uploads volume is empty on first boot, populate from image defaults.
if [ ! -d "/app/public/uploads/products" ] || [ -z "$(ls -A /app/public/uploads/products 2>/dev/null || true)" ]; then
  echo "Bootstrapping uploads volume from image defaults..."
  mkdir -p /app/public/uploads
  cp -R /app/bootstrap-uploads/* /app/public/uploads/ 2>/dev/null || true
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ -n "${SEED_ADMIN_PASSWORD}" ]; then
  echo "SEED_ADMIN_PASSWORD detected, running seed..."
  npx prisma db seed
else
  echo "SEED_ADMIN_PASSWORD not set, skipping seed."
fi

echo "Starting Next.js..."
exec node server.js
