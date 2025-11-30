#! /usr/bin/env bash
set -e
set -x

# Let the DB start
python << END
import sys
import time
import psycopg2
from urllib.parse import urlparse
import os

url = urlparse(os.getenv("DATABASE_URL"))
dbname = url.path[1:]
user = url.username
password = url.password
host = url.hostname
port = url.port

while True:
    try:
        psycopg2.connect(
            dbname=dbname,
            user=user,
            password=password,
            host=host,
            port=port
        )
        break
    except psycopg2.OperationalError:
        sys.stdout.write("Waiting for database to become available...\n")
        time.sleep(1)
END

alembic upgrade head
