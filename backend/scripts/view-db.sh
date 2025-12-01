#!/bin/bash

# Quick database viewer script using psql

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "Connecting to pokergto database..."
echo "Type 'help' for commands, '\q' to quit"
echo ""

# Connect to the database
psql -d pokergto

