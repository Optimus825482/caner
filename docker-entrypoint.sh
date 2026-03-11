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

echo "Running Prisma migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "Starting Next.js..."
exec node server.js
