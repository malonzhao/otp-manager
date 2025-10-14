#!/bin/sh

cd /app/dist || exit 1

if [ -f /app/data/opt.db ]; then
  npm run db:migrate || exit 1
else
  npm run db:migrate || exit 1
  npm run db:seed || exit 1
fi

if [ $# -gt 0 ]; then
    exec "$@"
else
    exec /usr/bin/supervisord -c /etc/supervisord.conf
fi