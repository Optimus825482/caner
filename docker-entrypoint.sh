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

# Always sync bootstrap uploads — copy missing files without overwriting existing ones.
if [ -d "/app/bootstrap-uploads" ]; then
  echo "Syncing uploads from image defaults (skip existing)..."
  mkdir -p /app/public/uploads
  cp -Rn /app/bootstrap-uploads/* /app/public/uploads/ 2>/dev/null || true
  # Force-update branding assets on every deploy (logo changes must propagate)
  for f in logo.png favicon.ico; do
    if [ -f "/app/bootstrap-uploads/products/$f" ]; then
      cp -f "/app/bootstrap-uploads/products/$f" "/app/public/uploads/products/$f" 2>/dev/null || true
    fi
  done
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
