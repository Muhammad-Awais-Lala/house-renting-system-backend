# Intelligent House Renting System - Backend

A robust, production-ready Node.js backend for a comprehensive house renting platform with AI-powered recommendations, property management, booking system, and user reviews.

## 🌟 Features

### Core Features
- ✅ **User Authentication**: JWT-based secure authentication
- ✅ **Role-Based Access Control**: Tenant, Landlord, Admin roles
- ✅ **Property Management**: Full CRUD operations for properties
- ✅ **Booking System**: Request, approve, reject bookings
- ✅ **Review System**: Rate and review properties
- ✅ **AI Recommendations**: Hugging Face integration for smart suggestions
- ✅ **Image Management**: Cloudinary integration for property images
- ✅ **Search & Filter**: Advanced property search with multiple filters
- ✅ **Location Support**: Latitude/longitude for map integration

### Security Features
- 🔒 **Password Hashing**: Bcrypt encryption
- 🔐 **JWT Authentication**: Secure token-based auth
- 🛡️ **CORS Protection**: Configurable cross-origin requests
- ⚠️ **Rate Limiting**: Protection against brute force attacks
- 🔑 **Role-Based Authorization**: Granular access control
- 📝 **Input Validation**: All endpoints validated
- 🚨 **Centralized Error Handling**: Consistent error responses

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- MongoDB (Atlas or local)
- Cloudinary account
- Hugging Face API key (optional)

### Installation

1. **Clone and navigate to backend**:
```bash
cd backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create `.env` file** (use `.env.example` as template):
```bash
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intelligent_house_renting

# JWT
JWT_SECRET=your_secure_secret_key
JWT_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=development

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Hugging Face (optional)
HUGGING_FACE_API_KEY=your_api_key
HUGGING_FACE_MODEL=your_model_id

# CORS
CLIENT_URL=http://localhost:3000
```

4. **Start the server**:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will be running at `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── config/                  # Configuration
│   ├── database.js         # MongoDB connection
│   └── cloudinary.js       # Cloudinary setup
├── controllers/            # Business logic handlers
│   ├── userController.js
│   ├── propertyController.js
│   ├── bookingController.js
│   ├── reviewController.js
│   └── recommendationController.js
├── models/                 # Database schemas
│   ├── User.js
│   ├── Property.js
│   ├── Booking.js
│   └── Review.js
├── routes/                 # API routes
│   ├── userRoutes.js
│   ├── propertyRoutes.js
│   ├── bookingRoutes.js
│   ├── reviewRoutes.js
│   └── recommendationRoutes.js
├── middleware/             # Custom middleware
│   ├── auth.js            # JWT verification
│   ├── authorization.js   # Role checking
│   └── errorHandler.js    # Error handling
├── services/               # Business logic services
│   ├── authService.js
│   ├── cloudinaryService.js
│   └── recommendationService.js
├── utils/                  # Utility functions
│   ├── validators.js      # Input validation
│   └── errorResponse.js   # Error class
├── server.js              # Application entry point
├── package.json
├── .env.example
└── API_DOCUMENTATION.md
```

## 🔌 API Endpoints

### Users
```
POST   /api/users/register              - Register new user
POST   /api/users/login                 - Login user
GET    /api/users/:id                   - Get user profile
PUT    /api/users/:id                   - Update profile
GET    /api/users/role/:role            - Get users by role
GET    /api/users                       - Get all users (Admin)
DELETE /api/users/:id                   - Delete user (Admin)
```

### Properties
```
POST   /api/properties                  - Create property (Landlord)
GET    /api/properties                  - Get all properties
GET    /api/properties/:id              - Get property details
PUT    /api/properties/:id              - Update property (Landlord)
DELETE /api/properties/:id              - Delete property (Landlord)
GET    /api/properties/landlord/:id     - Get landlord properties
DELETE /api/properties/:id/images/:idx  - Delete image (Landlord)
```

### Bookings
```
POST   /api/bookings                    - Create booking (Tenant)
GET    /api/bookings                    - Get user bookings
GET    /api/bookings/:id                - Get booking details
PUT    /api/bookings/:id/accept         - Accept booking (Landlord)
PUT    /api/bookings/:id/reject         - Reject booking (Landlord)
PUT    /api/bookings/:id/cancel         - Cancel booking (Tenant)
GET    /api/bookings/property/:id       - Get property bookings (Landlord)
```

### Reviews
```
POST   /api/reviews                     - Create review (Tenant)
GET    /api/reviews/property/:id        - Get property reviews
GET    /api/reviews/:id                 - Get review details
PUT    /api/reviews/:id                 - Update review (Tenant)
DELETE /api/reviews/:id                 - Delete review (Tenant)
GET    /api/reviews/tenant/:id          - Get tenant reviews
PUT    /api/reviews/:id/helpful         - Mark review helpful
```

### Recommendations
```
POST   /api/recommendations             - Get AI recommendations (Tenant)
POST   /api/recommendations/filter      - Filter properties
```

## 📚 Usage Examples

### 1. Register a User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "role": "tenant"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Create Property (Landlord)
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "Modern 2BR Apartment",
    "description": "Beautiful apartment in downtown",
    "propertyType": "apartment",
    "price": 1500,
    "bedrooms": 2,
    "bathrooms": 1,
    "propertySize": 900,
    "location": "New York, NY",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "amenities": ["wifi", "parking"]
  }'
```

### 4. Get All Properties
```bash
curl "http://localhost:3000/api/properties?location=New%20York&maxPrice=2000&bedrooms=2"
```

### 5. Create Booking (Tenant)
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "propertyId": "507f1f77bcf86cd799439011",
    "checkInDate": "2024-02-01T00:00:00Z",
    "checkOutDate": "2024-02-08T00:00:00Z",
    "numberOfGuests": 2,
    "message": "I am interested in this property"
  }'
```

### 6. Create Review (Tenant)
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "propertyId": "507f1f77bcf86cd799439011",
    "rating": 4,
    "title": "Great apartment",
    "comment": "Very comfortable and clean",
    "pros": ["Clean", "Spacious"],
    "cons": ["No parking"]
  }'
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token includes:
- User ID
- Email
- Role

## 📊 Database Models

### User
- firstName, lastName, email (unique)
- password (hashed)
- role (tenant, landlord, admin)
- profileImage, phoneNumber, bio
- address, city, country, zipCode

### Property
- title, description, propertyType
- price, bedrooms, bathrooms, propertySize
- location (text + coordinates for maps)
- images (Cloudinary URLs)
- landlordId (reference)
- averageRating, totalReviews

### Booking
- tenantId, propertyId, landlordId
- checkInDate, checkOutDate
- status (pending, accepted, rejected, cancelled)
- totalPrice, message

### Review
- propertyId, tenantId, landlordId
- rating (1-5), title, comment
- pros, cons, isVerifiedTenant
- helpful (count)

## 🤖 AI Recommendations

The system integrates with Hugging Face API for intelligent property recommendations:

**Request**:
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

**Response**:
```json
{
  "success": true,
  "count": 15,
  "recommendations": [...],
  "aiInsights": {...}
}
```

## 🖼️ Image Management

Images are stored on Cloudinary with automatic deletion support:
- Upload properties with multiple images
- Update and delete images
- Profile pictures for users
- Secure URLs returned in API responses

## 📋 Input Validation

All endpoints include comprehensive validation:
- Email format validation
- Price and size validation
- Coordinate validation for maps
- Rating validation (1-5)
- Required field validation
- Role validation

## 🚨 Error Handling

Centralized error handling with consistent responses:

```json
{
  "success": false,
  "message": "Specific error description",
  "statusCode": 400
}
```

## 🛠️ Development

### Dependencies
```json
{
  "express": "^5.2.1",
  "mongoose": "^8.0.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.1.2",
  "dotenv": "^16.3.1",
  "cloudinary": "^1.40.0",
  "multer": "^1.4.5",
  "axios": "^1.6.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5"
}
```

### Development Mode
```bash
npm run dev
```
Uses nodemon for auto-reload on file changes.

## 🔄 Integration with Frontend

1. **User IDs**: Obtained from registration/login for chat integration
2. **Property IDs**: Available in all property endpoints for bookings/reviews
3. **Coordinates**: Use latitude/longitude for map display
4. **Images**: Cloudinary URLs ready for display
5. **Tokens**: Store JWT in localStorage/sessionStorage

## 📝 Environment Setup

See `.env.example` for complete environment variables:

```bash
cp .env.example .env
# Edit .env with your credentials
```

## 🧪 Testing Endpoints

Use Postman or cURL to test:
1. Register user
2. Login and get token
3. Create property (as landlord)
4. Browse properties
5. Create booking (as tenant)
6. Accept/reject booking (as landlord)
7. Leave review (as tenant)
8. Get recommendations

## 📞 API Health Check

```bash
GET http://localhost:3000/api/health
```

Returns:
```json
{
  "success": true,
  "message": "Server is running"
}
```

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use strong JWT_SECRET
3. Configure MongoDB Atlas connection
4. Set appropriate CORS_URL
5. Use environment variables for all secrets
6. Enable rate limiting
7. Use HTTPS
8. Set proper error logging

## 📚 Full Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for:
- Detailed endpoint specifications
- Request/response examples
- Error codes
- Database schema details
- Security features
- Scalability notes

## 🤝 Contributing

1. Follow the modular architecture
2. Add validation for all inputs
3. Use proper error handling
4. Document new endpoints
5. Test thoroughly

## 📄 License

ISC

## 👨‍💻 Author

Intelligent House Renting System Development Team

---

**Ready to deploy!** The backend is production-ready with all features implemented. Configure your environment variables and start the server.
