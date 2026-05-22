# Intelligent House Renting System - Backend API Documentation

## Overview

This is a complete backend system for an Intelligent House Renting Platform built with Node.js, Express.js, and MongoDB. The system supports three user roles: **Tenant**, **Landlord**, and **Admin**, with features including authentication, property management, booking system, reviews, and AI-based recommendations.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Image Storage**: Cloudinary
- **AI Integration**: Hugging Face API
- **Security**: bcryptjs, helmet, CORS, rate limiting

## Project Structure

```
backend/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   └── cloudinary.js    # Cloudinary setup
├── controllers/         # Business logic
│   ├── userController.js
│   ├── propertyController.js
│   ├── bookingController.js
│   ├── reviewController.js
│   └── recommendationController.js
├── models/              # Database schemas
│   ├── User.js
│   ├── Property.js
│   ├── Booking.js
│   └── Review.js
├── routes/              # API endpoints
│   ├── userRoutes.js
│   ├── propertyRoutes.js
│   ├── bookingRoutes.js
│   ├── reviewRoutes.js
│   └── recommendationRoutes.js
├── middleware/          # Custom middleware
│   ├── auth.js          # JWT authentication
│   ├── authorization.js # Role-based access
│   └── errorHandler.js  # Error handling
├── services/            # Reusable business logic
│   ├── authService.js
│   ├── cloudinaryService.js
│   └── recommendationService.js
├── utils/               # Utility functions
│   ├── validators.js
│   └── errorResponse.js
├── server.js            # Entry point
└── .env.example         # Environment variables template
```

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB account (Atlas or local)
- Cloudinary account
- Hugging Face API key (optional)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intelligent_house_renting

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=development

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Hugging Face
HUGGING_FACE_API_KEY=your_hugging_face_api_key
HUGGING_FACE_MODEL=your_model_id

# CORS
CLIENT_URL=http://localhost:3000
```

### Step 3: Start the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints Overview

### Base URL
```
http://localhost:3000/api
```

## User Management

### Authentication

#### Register User
- **POST** `/users/register`
- **Access**: Public
- **Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "tenant"
}
```
- **Response**: `{ success: true, token: "...", user: {...} }`

#### Login User
- **POST** `/users/login`
- **Access**: Public
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response**: `{ success: true, token: "...", user: {...} }`

### User Profile

#### Get User Profile
- **GET** `/users/:id`
- **Access**: Private
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true, user: {...} }`

#### Update User Profile
- **PUT** `/users/:id`
- **Access**: Private
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "bio": "I'm a tenant looking for a nice apartment",
  "address": "123 Main St",
  "city": "New York",
  "country": "USA",
  "zipCode": "10001"
}
```
- **Response**: `{ success: true, message: "Profile updated", user: {...} }`

#### Get Users by Role
- **GET** `/users/role/:role`
- **Access**: Public
- **Parameters**: `role` = "tenant" | "landlord" | "admin"
- **Response**: `{ success: true, count: 10, users: [...] }`

#### Get All Users (Admin)
- **GET** `/users`
- **Access**: Private/Admin
- **Query Parameters**: `role`, `isActive`
- **Response**: `{ success: true, count: 50, users: [...] }`

#### Delete User (Admin)
- **DELETE** `/users/:id`
- **Access**: Private/Admin
- **Response**: `{ success: true, message: "User deleted" }`

## Property Management

### Create Property (Landlord)
- **POST** `/properties`
- **Access**: Private/Landlord
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "title": "Beautiful 2BR Apartment",
  "description": "Modern apartment in the heart of the city",
  "propertyType": "apartment",
  "price": 1500,
  "bedrooms": 2,
  "bathrooms": 1,
  "propertySize": 900,
  "sizeUnit": "sqft",
  "location": "New York, NY",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "amenities": ["wifi", "parking", "gym"],
  "availableFrom": "2024-01-15"
}
```
- **Response**: `{ success: true, message: "Property created", property: {...} }`

### Get All Properties
- **GET** `/properties`
- **Access**: Public
- **Query Parameters**:
  - `location`: Search by location
  - `minPrice`: Minimum price
  - `maxPrice`: Maximum price
  - `minSize`: Minimum property size
  - `propertyType`: "apartment" | "house" | "condo" | "townhouse" | "studio" | "penthouse"
  - `bedrooms`: Minimum bedrooms
  - `bathrooms`: Minimum bathrooms
  - `search`: Text search in title/description
  - `sort`: "price_asc" | "price_desc" | "newest" | "rating"
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 12)
- **Response**:
```json
{
  "success": true,
  "count": 12,
  "total": 100,
  "pages": 9,
  "currentPage": 1,
  "properties": [...]
}
```

### Get Single Property
- **GET** `/properties/:id`
- **Access**: Public
- **Response**:
```json
{
  "success": true,
  "property": {...},
  "reviews": [...]
}
```

### Update Property (Landlord)
- **PUT** `/properties/:id`
- **Access**: Private/Landlord
- **Headers**: `Authorization: Bearer {token}`
- **Body**: Same as create (all fields optional)
- **Response**: `{ success: true, message: "Property updated", property: {...} }`

### Delete Property (Landlord)
- **DELETE** `/properties/:id`
- **Access**: Private/Landlord
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true, message: "Property deleted" }`

### Get Landlord Properties
- **GET** `/properties/landlord/:landlordId`
- **Access**: Public
- **Query Parameters**: `page`, `limit`
- **Response**: `{ success: true, count: 5, total: 5, properties: [...] }`

### Delete Property Image
- **DELETE** `/properties/:id/images/:imageIndex`
- **Access**: Private/Landlord
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true, message: "Image deleted", property: {...} }`

## Booking System

### Create Booking Request (Tenant)
- **POST** `/bookings`
- **Access**: Private/Tenant
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "propertyId": "507f1f77bcf86cd799439011",
  "checkInDate": "2024-02-01T00:00:00Z",
  "checkOutDate": "2024-02-08T00:00:00Z",
  "numberOfGuests": 2,
  "message": "I would like to book this property"
}
```
- **Response**: `{ success: true, message: "Booking request created", booking: {...} }`

### Get User Bookings
- **GET** `/bookings`
- **Access**: Private
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**: `status` = "pending" | "accepted" | "rejected" | "cancelled", `page`, `limit`
- **Response**: `{ success: true, count: 5, total: 5, bookings: [...] }`

### Get Booking by ID
- **GET** `/bookings/:id`
- **Access**: Private
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true, booking: {...} }`

### Accept Booking (Landlord)
- **PUT** `/bookings/:id/accept`
- **Access**: Private/Landlord
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true, message: "Booking accepted", booking: {...} }`

### Reject Booking (Landlord)
- **PUT** `/bookings/:id/reject`
- **Access**: Private/Landlord
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "rejectionReason": "Property is no longer available"
}
```
- **Response**: `{ success: true, message: "Booking rejected", booking: {...} }`

### Cancel Booking (Tenant)
- **PUT** `/bookings/:id/cancel`
- **Access**: Private/Tenant
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true, message: "Booking cancelled", booking: {...} }`

### Get Property Bookings (Landlord)
- **GET** `/bookings/property/:propertyId`
- **Access**: Private/Landlord
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**: `page`, `limit`
- **Response**: `{ success: true, count: 5, total: 5, bookings: [...] }`

## Reviews & Ratings

### Create Review (Tenant)
- **POST** `/reviews`
- **Access**: Private/Tenant
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "propertyId": "507f1f77bcf86cd799439011",
  "rating": 4,
  "title": "Great apartment!",
  "comment": "Very comfortable and well-maintained property.",
  "pros": ["Clean", "Spacious", "Good location"],
  "cons": ["No parking"]
}
```
- **Response**: `{ success: true, message: "Review created", review: {...} }`

### Get Property Reviews
- **GET** `/reviews/property/:propertyId`
- **Access**: Public
- **Query Parameters**:
  - `sortBy`: "newest" | "highest" | "lowest" | "helpful"
  - `page`: Page number
  - `limit`: Items per page
- **Response**: `{ success: true, count: 5, total: 5, reviews: [...] }`

### Get Single Review
- **GET** `/reviews/:id`
- **Access**: Public
- **Response**: `{ success: true, review: {...} }`

### Get Tenant Reviews
- **GET** `/reviews/tenant/:tenantId`
- **Access**: Public
- **Query Parameters**: `page`, `limit`
- **Response**: `{ success: true, count: 5, total: 5, reviews: [...] }`

### Update Review (Tenant)
- **PUT** `/reviews/:id`
- **Access**: Private/Tenant
- **Headers**: `Authorization: Bearer {token}`
- **Body**: Same as create (all fields optional)
- **Response**: `{ success: true, message: "Review updated", review: {...} }`

### Delete Review (Tenant)
- **DELETE** `/reviews/:id`
- **Access**: Private/Tenant
- **Headers**: `Authorization: Bearer {token}`
- **Response**: `{ success: true, message: "Review deleted" }`

### Mark Review as Helpful
- **PUT** `/reviews/:id/helpful`
- **Access**: Public
- **Response**: `{ success: true, message: "Review marked as helpful", review: {...} }`

## AI-Based Recommendations

### Get Recommendations
- **POST** `/recommendations`
- **Access**: Private
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
```json
{
  "budget": 2000,
  "location": "New York",
  "propertySize": 800,
  "propertyType": "apartment",
  "bedrooms": 2,
  "bathrooms": 1
}
```
- **Response**:
```json
{
  "success": true,
  "count": 12,
  "recommendations": [...],
  "aiInsights": {...}
}
```

### Filter Properties
- **POST** `/recommendations/filter`
- **Access**: Public
- **Body**: Same as recommendations
- **Response**:
```json
{
  "success": true,
  "count": 15,
  "properties": [...]
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Auth required |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

## Authentication Flow

1. **Register** → Get JWT token
2. **Login** → Get JWT token
3. **Include token** in Authorization header: `Authorization: Bearer {token}`
4. **Token expires** in 7 days (configurable via JWT_EXPIRY)

## Database Schema Overview

### User Schema
- Email (unique)
- Password (hashed)
- Role (tenant, landlord, admin)
- Profile information
- Timestamps

### Property Schema
- Title, description, type
- Price, size, bedrooms, bathrooms
- Location (text + coordinates)
- Images (Cloudinary URLs)
- Landlord reference
- Availability status
- Ratings & reviews count

### Booking Schema
- Tenant & landlord references
- Property reference
- Check-in/out dates
- Status (pending, accepted, rejected, cancelled)
- Total price

### Review Schema
- Property & tenant references
- Rating (1-5)
- Title & comment
- Pros & cons
- Verification status

## Security Features

✅ **Password Hashing**: bcryptjs with salt rounds
✅ **JWT Authentication**: Token-based auth
✅ **Role-Based Access Control**: Middleware-enforced
✅ **CORS Protection**: Configurable origins
✅ **Rate Limiting**: 100 requests per 15 minutes
✅ **Helmet**: HTTP headers security
✅ **Input Validation**: All endpoints validated
✅ **Error Handling**: Centralized error middleware

## File Upload (Cloudinary)

Property images are uploaded to Cloudinary. To enable:

1. Create Cloudinary account
2. Add credentials to `.env`
3. Images are stored with folder: `intelligent-house-renting`
4. Public IDs allow deletion of old images

## Integration Notes

### For Frontend:

1. **Store JWT token** in localStorage/sessionStorage
2. **Include token** in all authenticated requests
3. **User IDs & Property IDs** are available in responses for chat integration
4. **Use coordinates** for map integration

### For Chat System:

- User IDs from `/users/:id`
- Property IDs from `/properties`
- Booking details include all necessary references

## Scalability Considerations

- **Database Indexes**: Created on frequently queried fields
- **Pagination**: Implemented on all list endpoints
- **Modular Architecture**: Easy to extend with new features
- **Service Layer**: Reusable business logic
- **Error Handling**: Centralized and consistent

## Future Enhancements

- Payment integration (Stripe, PayPal)
- Email notifications
- Advanced analytics
- Machine learning improvements
- Real-time notifications (Socket.io)
- SMS integration
- Multi-language support

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| MONGODB_URI | Yes | MongoDB connection string |
| JWT_SECRET | Yes | Secret for JWT signing |
| JWT_EXPIRY | No | Token expiration (default: 7d) |
| PORT | No | Server port (default: 3000) |
| NODE_ENV | No | Environment (default: development) |
| CLOUDINARY_CLOUD_NAME | Yes | Cloudinary account name |
| CLOUDINARY_API_KEY | Yes | Cloudinary API key |
| CLOUDINARY_API_SECRET | Yes | Cloudinary API secret |
| HUGGING_FACE_API_KEY | No | For AI recommendations |
| HUGGING_FACE_MODEL | No | Model ID for recommendations |
| CLIENT_URL | No | Frontend URL for CORS |

## Health Check

```bash
GET http://localhost:3000/api/health
```

## Support & Issues

For issues or questions, please refer to the project documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2024
