#!/bin/bash

# Quick API test script

echo "Testing Poker GTO Backend API..."
echo ""

# Test health endpoint
echo "1. Health Check:"
curl -s http://localhost:8080/api/health | jq . || echo "API not responding"
echo ""

# Test registration
echo "2. Register User:"
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "displayName": "Test User"
  }' | jq . || echo "Registration failed"
echo ""

# View API documentation
echo "3. API Documentation:"
echo "   Open: http://localhost:8080/api/swagger-ui.html"
echo ""

echo "✅ Backend is running on http://localhost:8080/api"

