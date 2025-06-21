#!/bin/bash

# Get fresh token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "mahbub@example.com", "password": "mahbub123"}' | jq -r '.token')

echo "Token: $TOKEN"

# Add meals for the last 7 days
echo "Adding meals..."

# Day 1
curl -X POST http://localhost:5001/api/meals/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date": "2024-06-21", "breakfast": true, "lunch": true, "dinner": true, "notes": "Full day of meals"}'

# Day 2
curl -X POST http://localhost:5001/api/meals/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date": "2024-06-20", "breakfast": false, "lunch": true, "dinner": true, "notes": "Skipped breakfast"}'

# Day 3
curl -X POST http://localhost:5001/api/meals/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date": "2024-06-19", "breakfast": true, "lunch": false, "dinner": true, "notes": "Light lunch"}'

# Day 4
curl -X POST http://localhost:5001/api/meals/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date": "2024-06-18", "breakfast": true, "lunch": true, "dinner": false, "notes": "No dinner"}'

# Day 5
curl -X POST http://localhost:5001/api/meals/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date": "2024-06-17", "breakfast": true, "lunch": true, "dinner": true, "notes": "Regular day"}'

# Day 6
curl -X POST http://localhost:5001/api/meals/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date": "2024-06-16", "breakfast": false, "lunch": false, "dinner": true, "notes": "Only dinner"}'

# Day 7
curl -X POST http://localhost:5001/api/meals/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"date": "2024-06-15", "breakfast": true, "lunch": true, "dinner": true, "notes": "Full meals"}'

echo "Meals added successfully!"

# Add bazar entries
echo "Adding bazar entries..."

# Bazar entry 1
curl -X POST http://localhost:5001/api/bazar/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2024-06-20",
    "items": [
      {"name": "Rice", "quantity": "5 kg", "price": 600},
      {"name": "Vegetables", "quantity": "2 kg", "price": 300},
      {"name": "Fish", "quantity": "1 kg", "price": 400}
    ],
    "totalAmount": 1300,
    "description": "Weekly grocery shopping",
    "notes": "Good quality items"
  }'

# Bazar entry 2
curl -X POST http://localhost:5001/api/bazar/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2024-06-17",
    "items": [
      {"name": "Chicken", "quantity": "2 kg", "price": 500},
      {"name": "Oil", "quantity": "1 L", "price": 180},
      {"name": "Spices", "quantity": "0.5 kg", "price": 100}
    ],
    "totalAmount": 780,
    "description": "Cooking essentials",
    "notes": "Fresh chicken"
  }'

# Bazar entry 3
curl -X POST http://localhost:5001/api/bazar/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2024-06-14",
    "items": [
      {"name": "Eggs", "quantity": "30 pieces", "price": 150},
      {"name": "Milk", "quantity": "2 L", "price": 200},
      {"name": "Bread", "quantity": "2 packets", "price": 80},
      {"name": "Potatoes", "quantity": "3 kg", "price": 120}
    ],
    "totalAmount": 550,
    "description": "Breakfast items",
    "notes": "Fresh dairy products"
  }'

# Bazar entry 4
curl -X POST http://localhost:5001/api/bazar/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2024-06-11",
    "items": [
      {"name": "Cooking Gas", "quantity": "1 cylinder", "price": 1200},
      {"name": "Sugar", "quantity": "1 kg", "price": 120},
      {"name": "Tea", "quantity": "0.5 kg", "price": 200}
    ],
    "totalAmount": 1520,
    "description": "Gas and essentials",
    "notes": "Monthly gas refill"
  }'

echo "Bazar entries added successfully!"

echo "All data for Mahbub has been added!" 