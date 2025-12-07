#!/bin/bash
# Backup Database Script
echo "Backing up database..."
docker exec -t cosmoquant_db pg_dumpall -c -U postgres > dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
echo "Backup complete!"
