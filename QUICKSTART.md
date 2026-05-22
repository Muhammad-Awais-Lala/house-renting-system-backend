# Quick Start Guide - API Testing

This guide provides quick examples to test the Intelligent House Renting System API.

## Prerequisites

- Node.js installed
- MongoDB running
- Postman or cURL
- Environment variables configured (.env file)

## Starting the Server

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Start in development mode
npm run dev

# Server will start on http://localhost:3000
```

## Testing with cURL

### 1. Health Check

```bash
curl http://localhost:5000/api/health
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Server is running"
}
```

### 2. User Registration (Tenant)

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Tenant",
    "email": "tenant@example.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "role": "tenant"
  }'
```

**Save the token from response** - you'll need it for protected routes.

### 3. User Registration (Landlord)

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Landlord",
    "email": "landlord@example.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "role": "landlord"
  }'
```

### 4. Login

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tenant@example.com",
    "password": "Password123"
  }'
```

**Save the token returned**.

### 5. Get User Profile

```bash
# Replace TOKEN with actual JWT token
# Replace USER_ID with actual user ID

curl http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer TOKEN"
```

### 6. Create Property (Landlord)

```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LANDLORD_TOKEN" \
  -d '{
    "title": "Beautiful Modern Apartment",
    "description": "Spacious 2-bedroom apartment with stunning city views in the heart of Manhattan. Fully furnished, modern amenities, natural light throughout.",
    "propertyType": "apartment",
    "price": 2500,
    "bedrooms": 2,
    "bathrooms": 1.5,
    "propertySize": 950,
    "sizeUnit": "sqft",
    "location": "123 Main St, New York, NY 10001",
    "latitude": 40.7580,
    "longitude": -73.9855,
    "amenities": ["wifi", "parking", "gym", "pool", "balcony"],
    "availableFrom": "2024-01-15T00:00:00Z"
  }'
```

**Save the property ID from response**.

### 7. Create Another Property

```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LANDLORD_TOKEN" \
  -d '{
    "title": "Cozy Studio in Brooklyn",
    "description": "Charming studio apartment perfect for singles or couples. Recently renovated with modern kitchen and bathroom.",
    "propertyType": "studio",
    "price": 1800,
    "bedrooms": 0,
    "bathrooms": 1,
    "propertySize": 400,
    "sizeUnit": "sqft",
    "location": "456 Oak Ave, Brooklyn, NY 11201",
    "latitude": 40.6944,
    "longitude": -73.9485,
    "amenities": ["wifi", "dishwasher", "ac"],
    "availableFrom": "2024-02-01T00:00:00Z"
  }'
```

### 8. Get All Properties

```bash
# Get all properties
curl http://localhost:3000/api/properties

# Get with filters
curl "http://localhost:3000/api/properties?minPrice=1500&maxPrice=3000&bedrooms=2&sort=price_asc"

# Get with location filter
curl "http://localhost:3000/api/properties?location=New%20York&limit=5"

# Get with text search
curl "http://localhost:3000/api/properties?search=modern%20apartment&page=1&limit=10"
```

### 9. Get Single Property

```bash
curl http://localhost:3000/api/properties/PROPERTY_ID
```

### 10. Update Property (Landlord)

```bash
curl -X PUT http://localhost:3000/api/properties/PROPERTY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LANDLORD_TOKEN" \
  -d '{
    "title": "Beautiful Modern Apartment - Updated",
    "price": 2600,
    "amenities": ["wifi", "parking", "gym", "pool", "balcony", "fireplace"]
  }'
```

### 11. Create Booking (Tenant)

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TENANT_TOKEN" \
  -d '{
    "propertyId": "PROPERTY_ID",
    "checkInDate": "2024-02-15T15:00:00Z",
    "checkOutDate": "2024-02-22T11:00:00Z",
    "numberOfGuests": 2,
    "message": "Hello, I am very interested in booking your property. Looking forward to hearing from you!"
  }'
```

**Save the booking ID from response**.

### 12. Get User Bookings

```bash
# Tenant views their bookings
curl http://localhost:3000/api/bookings \
  -H "Authorization: Bearer TENANT_TOKEN"

# Landlord views booking requests
curl http://localhost:3000/api/bookings \
  -H "Authorization: Bearer LANDLORD_TOKEN"

# Filter by status
curl "http://localhost:3000/api/bookings?status=pending" \
  -H "Authorization: Bearer TENANT_TOKEN"
```

### 13. Accept Booking (Landlord)

```bash
curl -X PUT http://localhost:3000/api/bookings/BOOKING_ID/accept \
  -H "Authorization: Bearer LANDLORD_TOKEN"
```

### 14. Reject Booking (Landlord)

```bash
curl -X PUT http://localhost:3000/api/bookings/BOOKING_ID/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LANDLORD_TOKEN" \
  -d '{
    "rejectionReason": "Property is no longer available for those dates"
  }'
```

### 15. Cancel Booking (Tenant)

```bash
curl -X PUT http://localhost:3000/api/bookings/BOOKING_ID/cancel \
  -H "Authorization: Bearer TENANT_TOKEN"
```

### 16. Create Review (Tenant)

**Important**: Tenant must have an accepted booking for the property first.

```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TENANT_TOKEN" \
  -d '{
    "propertyId": "PROPERTY_ID",
    "rating": 5,
    "title": "Amazing Property - Highly Recommended!",
    "comment": "This property exceeded my expectations. The landlord was very responsive and helpful. The apartment is spacious, clean, and well-maintained. The location is perfect with great access to public transportation. I would definitely stay here again!",
    "pros": [
      "Clean and well-maintained",
      "Friendly landlord",
      "Great location",
      "Spacious rooms",
      "Good amenities"
    ],
    "cons": [
      "Slightly noisy neighborhood"
    ]
  }'
```

### 17. Get Property Reviews

```bash
curl http://localhost:3000/api/reviews/property/PROPERTY_ID

# Get with sorting
curl "http://localhost:3000/api/reviews/property/PROPERTY_ID?sortBy=highest&page=1&limit=5"
```

### 18. Update Review (Tenant)

```bash
curl -X PUT http://localhost:3000/api/reviews/REVIEW_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TENANT_TOKEN" \
  -d '{
    "rating": 4,
    "title": "Great Property - Updated",
    "comment": "Updated review with additional feedback."
  }'
```

### 19. Mark Review as Helpful

```bash
curl -X PUT http://localhost:3000/api/reviews/REVIEW_ID/helpful
```

### 20. Get Recommendations

```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TENANT_TOKEN" \
  -d '{
    "budget": 2500,
    "location": "New York",
    "propertySize": 800,
    "propertyType": "apartment",
    "bedrooms": 2,
    "bathrooms": 1
  }'
```

### 21. Filter Properties

```bash
curl -X POST http://localhost:3000/api/recommendations/filter \
  -H "Content-Type: application/json" \
  -d '{
    "budget": 2000,
    "bedrooms": 2,
    "bathrooms": 1
  }'
```

## Testing with Postman

### Import Collection

1. Open Postman
2. Click "Import" → "Raw text"
3. Paste the collection below

### Postman Collection (JSON)

```json
{
  "info": {
    "name": "Intelligent House Renting System",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register Tenant",
          "request": {
            "method": "POST",
            "url": "http://localhost:3000/api/users/register",
            "body": {
              "mode": "raw",
              "raw": "{\"firstName\":\"John\",\"lastName\":\"Tenant\",\"email\":\"tenant@example.com\",\"password\":\"Password123\",\"confirmPassword\":\"Password123\",\"role\":\"tenant\"}"
            }
          }
        },
        {
          "name": "Register Landlord",
          "request": {
            "method": "POST",
            "url": "http://localhost:3000/api/users/register",
            "body": {
              "mode": "raw",
              "raw": "{\"firstName\":\"Jane\",\"lastName\":\"Landlord\",\"email\":\"landlord@example.com\",\"password\":\"Password123\",\"confirmPassword\":\"Password123\",\"role\":\"landlord\"}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "http://localhost:3000/api/users/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"tenant@example.com\",\"password\":\"Password123\"}"
            }
          }
        }
      ]
    },
    {
      "name": "Properties",
      "item": [
        {
          "name": "Get All Properties",
          "request": {
            "method": "GET",
            "url": "http://localhost:3000/api/properties"
          }
        },
        {
          "name": "Create Property",
          "request": {
            "method": "POST",
            "url": "http://localhost:3000/api/properties",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"title\":\"Beautiful Apartment\",\"description\":\"Modern apartment\",\"propertyType\":\"apartment\",\"price\":2500,\"bedrooms\":2,\"bathrooms\":1.5,\"propertySize\":950,\"sizeUnit\":\"sqft\",\"location\":\"123 Main St, NYC\",\"latitude\":40.7128,\"longitude\":-74.0060,\"amenities\":[\"wifi\",\"parking\"]}"
            }
          }
        },
        {
          "name": "Get Single Property",
          "request": {
            "method": "GET",
            "url": "http://localhost:3000/api/properties/{{propertyId}}"
          }
        }
      ]
    },
    {
      "name": "Bookings",
      "item": [
        {
          "name": "Create Booking",
          "request": {
            "method": "POST",
            "url": "http://localhost:3000/api/bookings",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"propertyId\":\"{{propertyId}}\",\"checkInDate\":\"2024-02-15T15:00:00Z\",\"checkOutDate\":\"2024-02-22T11:00:00Z\",\"numberOfGuests\":2,\"message\":\"Interested in booking\"}"
            }
          }
        },
        {
          "name": "Get Bookings",
          "request": {
            "method": "GET",
            "url": "http://localhost:3000/api/bookings",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        },
        {
          "name": "Accept Booking",
          "request": {
            "method": "PUT",
            "url": "http://localhost:3000/api/bookings/{{bookingId}}/accept",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Reviews",
      "item": [
        {
          "name": "Create Review",
          "request": {
            "method": "POST",
            "url": "http://localhost:3000/api/reviews",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"propertyId\":\"{{propertyId}}\",\"rating\":5,\"title\":\"Great!\",\"comment\":\"Excellent property\",\"pros\":[\"Clean\",\"Good location\"],\"cons\":[\"Noisy\"]}"
            }
          }
        },
        {
          "name": "Get Property Reviews",
          "request": {
            "method": "GET",
            "url": "http://localhost:3000/api/reviews/property/{{propertyId}}"
          }
        }
      ]
    },
    {
      "name": "Recommendations",
      "item": [
        {
          "name": "Get Recommendations",
          "request": {
            "method": "POST",
            "url": "http://localhost:3000/api/recommendations",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"budget\":2500,\"location\":\"New York\",\"propertySize\":800,\"propertyType\":\"apartment\",\"bedrooms\":2,\"bathrooms\":1}"
            }
          }
        }
      ]
    }
  ]
}
```

## Testing Workflow

### Scenario: Complete Booking Process

1. **Register as Tenant**
   - Create tenant account
   - Save token

2. **Register as Landlord**
   - Create landlord account
   - Save token

3. **Create Properties (As Landlord)**
   - Create 2-3 properties
   - Save property IDs

4. **Browse Properties (As Tenant)**
   - Get all properties
   - Filter by location/price
   - Get single property details

5. **Create Booking (As Tenant)**
   - Book a property
   - Save booking ID

6. **Accept Booking (As Landlord)**
   - View pending bookings
   - Accept the booking

7. **Create Review (As Tenant)**
   - Review the property
   - Rate and comment
   - Save review ID

8. **Get Recommendations (As Tenant)**
   - Request recommendations
   - Get filtered results

## Common Testing Patterns

### Pattern 1: Get All, Then Get One

```bash
# Get list
curl http://localhost:3000/api/properties | jq '.properties[0]._id'

# Use the ID from above
curl http://localhost:3000/api/properties/{ID_FROM_ABOVE}
```

### Pattern 2: Create and Update

```bash
# Create
RESPONSE=$(curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '...')

# Extract ID
ID=$(echo $RESPONSE | jq '._id')

# Update using ID
curl -X PUT http://localhost:3000/api/properties/$ID ...
```

### Pattern 3: Test Authentication

```bash
# Should work (with token)
curl http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer VALID_TOKEN"

# Should fail (no token)
curl http://localhost:3000/api/users/USER_ID
# Returns 401

# Should fail (invalid token)
curl http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer INVALID_TOKEN"
# Returns 401
```

## Debugging Tips

### Check Server Logs
```bash
# Terminal where server is running shows:
- Requests received
- Errors and stack traces
- Connection status
```

### Use jq for Pretty JSON
```bash
curl http://localhost:3000/api/properties | jq .
```

### Save Response to File
```bash
curl http://localhost:3000/api/properties > response.json
```

### Use Postman Console
- F12 in Postman
- View request/response details
- See any errors

## Troubleshooting

### "No token provided"
- Ensure `Authorization` header is set
- Token format: `Bearer {token}`

### "Invalid token"
- Token may have expired
- Regenerate by login

### "Not authorized"
- Check user role
- Ensure you're accessing correct endpoints

### "Property not found"
- Verify property ID is correct
- Check it exists in database

### "Validation failed"
- Check required fields are provided
- Verify field types match schema

## Next Steps

1. ✅ Test all CRUD operations
2. ✅ Test authentication flows
3. ✅ Test authorization (role-based)
4. ✅ Test error cases
5. 🔄 Integrate with frontend
6. 🔄 Set up payment system
7. 🔄 Add email notifications

---

**Happy Testing!** 🚀
