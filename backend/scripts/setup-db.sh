#!/bin/bash

# Database setup script for local development

echo "Setting up PostgreSQL database for Mako Poker..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL not found. Installing via Homebrew..."
    brew install postgresql@16
    brew services start postgresql@16
    sleep 3
fi

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw makopoker; then
    echo "Database 'makopoker' already exists."
else
    echo "Creating database 'makopoker'..."
    createdb makopoker
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Connection details for PostgreSQL clients:"
echo "=========================================="
echo "Host: localhost"
echo "Port: 5432"
echo "User: $(whoami)"
echo "Password: (leave empty)"
echo "Database: makopoker"
echo ""
echo "To view the SQL schema, open:"
echo "  backend/src/main/resources/db/migration/V1__initial_schema.sql"
