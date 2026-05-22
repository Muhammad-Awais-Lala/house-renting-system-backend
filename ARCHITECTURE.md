# System Architecture & Design Document

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Data Models & Relationships](#data-models--relationships)
4. [API Design](#api-design)
5. [Authentication & Authorization](#authentication--authorization)
6. [Scalability & Performance](#scalability--performance)
7. [Integration Points](#integration-points)

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Applications                   │
│              (Web, Mobile, Admin Dashboard)                │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTPS REST API
┌────────────────▼────────────────────────────────────────────┐
│                  Express.js Server                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Route Handlers & Controllers              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │  Users   │ │Properties│ │ Bookings │ │ Reviews  │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Middleware & Services Layer                  │ │
│  │  ┌─────────────┐ ┌──────────┐ ┌──────────────────┐   │ │
│  │  │ Auth & JWT  │ │Cloudinary│ │Hugging Face API  │   │ │
│  │  └─────────────┘ └──────────┘ └──────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    │            │            │
┌───▼──┐  ┌─────▼────┐  ┌───▼────┐
│MongoDB│  │Cloudinary│  │ Hugging │
│       │  │(Images)  │  │  Face   │
└───────┘  └──────────┘  └────────┘
```

## Architecture Patterns

### 1. MVC Pattern (Modified)
- **Model**: Mongoose schemas (User, Property, Booking, Review)
- **View**: Not applicable (API returns JSON)
- **Controller**: Request handlers with business logic

### 2. Service-Oriented Architecture
```
Controllers → Services → Models → Database
```

Services abstract complex business logic:
- `authService.js`: Authentication operations
- `cloudinaryService.js`: Image management
- `recommendationService.js`: AI recommendations

### 3. Middleware Pipeline
```
Request → CORS → Rate Limit → Body Parser → Auth/Authorization → Controller → Error Handler → Response
```

### 4. Repository Pattern
Services act as repositories, handling all data access operations.

## Data Models & Relationships

### Entity Relationship Diagram

```
┌──────────────┐
│    User      │
├──────────────┤
│ _id (PK)     │
│ email        │
│ password     │
│ role         │
│ profile info │
└──────┬───────┘
       │
       │ 1:Many
       │
       ├─────────────────────┬──────────────────┐
       │                     │                  │
       │                     │                  │
    ┌──▼──────────┐    ┌────▼─────────┐  ┌───▼──────────┐
    │  Property   │    │   Booking    │  │   Review     │
    ├─────────────┤    ├──────────────┤  ├──────────────┤
    │ _id (PK)    │    │ _id (PK)     │  │ _id (PK)     │
    │ title       │    │ tenantId (FK)├─┼─ tenantId(FK)│
    │ description │    │ propertyId(FK)┤ │ propertyId(FK)
    │ price       │    │ landlordId(FK)├─┼─ landlordId(FK)
    │ landlordId  │    │ status       │  │ rating       │
    │ images      │    │ dates        │  │ comment      │
    │ location    │    │ totalPrice   │  │ pros/cons    │
    │ coordinates │    └──────────────┘  └──────────────┘
    │ ratings     │
    └─────────────┘
```

### User Schema

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (tenant|landlord|admin),
  phoneNumber: String,
  profileImage: String (Cloudinary URL),
  bio: String,
  address: String,
  city: String,
  country: String,
  zipCode: String,
  isVerified: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- Creates Properties (landlord role)
- Creates Bookings (tenant role)
- Writes Reviews (tenant role)
- Receives Bookings (landlord role)

### Property Schema

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  propertyType: String (apartment|house|condo|...),
  price: Number,
  bedrooms: Number,
  bathrooms: Number,
  propertySize: Number,
  sizeUnit: String (sqft|sqm),
  location: String,
  latitude: Number,
  longitude: Number,
  amenities: [String],
  images: [
    {
      url: String (Cloudinary),
      publicId: String
    }
  ],
  landlordId: ObjectId (FK → User),
  isAvailable: Boolean,
  availableFrom: Date,
  averageRating: Number (0-5),
  totalReviews: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- Belongs to User (landlordId)
- Has many Bookings (1:Many)
- Has many Reviews (1:Many)

**Indexes**:
- Geospatial: `{ latitude, longitude }`
- Price: `{ price }`
- Text search: `{ location, title, description }`
- Landlord: `{ landlordId }`

### Booking Schema

```javascript
{
  _id: ObjectId,
  tenantId: ObjectId (FK → User),
  propertyId: ObjectId (FK → Property),
  landlordId: ObjectId (FK → User),
  status: String (pending|accepted|rejected|cancelled),
  message: String,
  checkInDate: Date,
  checkOutDate: Date,
  numberOfGuests: Number,
  totalPrice: Number,
  rejectionReason: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Relationships**:
- Belongs to Tenant (User)
- Belongs to Property
- Belongs to Landlord (User)

**Status Flow**:
```
pending → accepted → completed
  ↓
  → rejected
  ↓
  → cancelled
```

### Review Schema

```javascript
{
  _id: ObjectId,
  propertyId: ObjectId (FK → Property),
  tenantId: ObjectId (FK → User),
  landlordId: ObjectId (FK → User),
  rating: Number (1-5),
  title: String,
  comment: String,
  pros: [String],
  cons: [String],
  isVerifiedTenant: Boolean,
  helpful: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Constraints**:
- Unique index: `{ propertyId, tenantId }` (One review per tenant per property)
- Only tenants with accepted bookings can review

**Relationships**:
- Belongs to Property
- Written by Tenant (User)
- About Landlord (User)

## API Design

### RESTful Principles

| Method | Purpose | Status Codes |
|--------|---------|--------------|
| GET | Retrieve resource(s) | 200, 404 |
| POST | Create resource | 201, 400 |
| PUT | Update resource | 200, 400, 404 |
| DELETE | Delete resource | 200, 404 |

### URL Structure

```
/api/{resource}/{id}/{action}
/api/users/123/profile
/api/properties/456/images/0
/api/bookings/789/accept
```

### Request/Response Pattern

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Response Format**:
```json
{
  "success": true/false,
  "message": "...",
  "data": {...} or [...]
}
```

### Pagination

For list endpoints:
```
?page=1&limit=10
Response includes: { count, total, pages, currentPage }
```

### Sorting

```
?sort=price_asc
?sort=price_desc
?sort=newest
?sort=rating
```

## Authentication & Authorization

### JWT Token Structure

```
Header.Payload.Signature

Payload contains:
{
  id: ObjectId,
  email: String,
  role: String,
  iat: Timestamp,
  exp: Timestamp
}
```

### Role-Based Access Control

```
Admin
├── View all users
├── Delete users
├── View all bookings
└── View all properties

Landlord
├── Create properties
├── Update own properties
├── Delete own properties
├── Accept/reject bookings
├── View own bookings
└── View own reviews

Tenant
├── View properties
├── Create bookings
├── Cancel own bookings
├── Create reviews
├── Update own reviews
└── Delete own reviews
```

### Authentication Flow

```
1. User Registration
   POST /users/register
   ↓
   Password → Hash (bcrypt)
   ↓
   User created in DB
   ↓
   JWT token generated & returned

2. User Login
   POST /users/login
   ↓
   Find user by email
   ↓
   Compare password with hash
   ↓
   If match: Generate JWT & return
   If no match: Return 401 Unauthorized

3. Protected Request
   GET /users/123
   Header: Authorization: Bearer {token}
   ↓
   Middleware verifies token signature
   ↓
   Extract user data from token
   ↓
   Check authorization level
   ↓
   Process request or return 403
```

### Password Security

- Hashing: bcryptjs with 10 salt rounds
- Never stored in plain text
- Never returned in API responses
- Never logged

## Scalability & Performance

### Database Optimization

#### Indexes

```javascript
// User indexes
email: { unique: true }

// Property indexes
{ latitude: 1, longitude: 1 }        // Geospatial
{ price: 1 }                          // Range queries
{ location: 'text', title: 'text' }  // Text search
{ landlordId: 1 }                     // Foreign key

// Booking indexes
{ tenantId: 1, propertyId: 1 }
{ landlordId: 1 }
{ propertyId: 1 }
{ status: 1 }

// Review indexes
{ propertyId: 1, rating: 1 }
{ tenantId: 1 }
{ propertyId: 1, tenantId: 1 }       // Unique
```

#### Query Optimization

- Pagination: Limit data transferred
- Population (joins): Selective field inclusion
- Lean queries: Exclude unnecessary fields
- Caching: Can be added for frequently accessed data

### API Performance

#### Rate Limiting
- 100 requests per 15 minutes per IP
- Prevents abuse and DDoS attacks

#### Caching Strategy (Future)
```javascript
// Example implementation
const cached = Redis.get(`properties:${id}`)
if (cached) return cached
const property = await Property.findById(id)
Redis.set(`properties:${id}`, property, 3600) // 1 hour
return property
```

### Horizontal Scalability

Current design supports:
- Stateless servers (horizontal scaling)
- Load balancing across multiple instances
- Shared MongoDB connection
- Cloudinary CDN for images

## Integration Points

### Frontend Integration

#### User Authentication
```javascript
// Frontend
const login = async (email, password) => {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  const { token } = await response.json()
  localStorage.setItem('token', token)
}

// All subsequent requests
fetch('/api/properties', {
  headers: { Authorization: `Bearer ${token}` }
})
```

#### Property Display
```javascript
// Backend response
GET /api/properties?location=NYC&maxPrice=2000
Returns: Coordinates, images, landlord info for display

// Frontend uses:
// - Images for gallery
// - Coordinates for map
// - User info for contact
```

#### Booking Flow
```
Frontend: User fills booking form
   ↓
Backend: POST /api/bookings
   ↓
Database: Create Booking (status: pending)
   ↓
Frontend: Show confirmation
   ↓
Landlord: Accept/Reject via admin panel
   ↓
Backend: PUT /api/bookings/:id/accept
   ↓
Frontend: Show updated status
```

### Chat System Integration

```javascript
// Chat needs these identifiers
User: {
  _id: "507f1f77bcf86cd799439011",  // From /users/:id
  name: "John Doe"
}

Property: {
  _id: "507f1f77bcf86cd799439012",  // From /properties
  title: "Nice Apartment"
}

// Chat links users to property
{
  tenantId: "507f1f77bcf86cd799439011",
  landlordId: "507f1f77bcf86cd799439010",
  propertyId: "507f1f77bcf86cd799439012"
}
```

### Image Management (Cloudinary)

```javascript
// Upload flow
Property Creation
   ↓
Files sent to Cloudinary API
   ↓
Cloudinary returns: {
  secure_url: "https://res.cloudinary.com/.../image.jpg",
  public_id: "intelligent-house-renting/property-123"
}
   ↓
Save URL to Property document
   ↓
Return in API response for display

// Deletion
Property Update
   ↓
Use stored public_id
   ↓
Call Cloudinary delete API
   ↓
Remove from Property document
```

### AI Recommendations (Hugging Face)

```javascript
// Input processing
User preferences: {
  budget: 2000,
  location: "NYC",
  propertySize: 800
}
   ↓
Convert to normalized vector
   ↓
Send to Hugging Face API
   ↓
Get similarity scores/recommendations
   ↓
Filter database by preferences
   ↓
Combine AI insights with database results
   ↓
Return to frontend
```

## Data Flow Examples

### Property Creation Flow

```
Landlord: POST /api/properties
        ↓
Middleware: Verify JWT token
        ↓
Middleware: Check role = "landlord"
        ↓
Validation: Check all required fields
        ↓
Controllers: propertyController.createProperty()
        ↓
Services: Upload images to Cloudinary
        ↓
Models: Create Property document
        ↓
Database: Save to MongoDB
        ↓
Populate: Fetch landlord details
        ↓
Response: Return created property with images
```

### Booking Request Flow

```
Tenant: POST /api/bookings
      ↓
Auth: Verify JWT (role must be tenant)
      ↓
Validation: Check dates, property exists
      ↓
Controller: Create booking
      ↓
Database: Save with status "pending"
      ↓
Notification: (Future) Email landlord
      ↓
Response: Return booking details

Landlord: PUT /api/bookings/:id/accept
        ↓
Auth: Verify JWT (role must be landlord)
        ↓
Authorization: Ensure landlord owns property
        ↓
Update: Change status to "accepted"
        ↓
Database: Save updated booking
        ↓
Notification: (Future) Email tenant
        ↓
Response: Return updated booking
```

## Error Handling Strategy

```
User Input Error (400)
├── Validation failed
├── Missing required fields
└── Invalid format

Authentication Error (401)
├── Token expired
├── Invalid credentials
└── No token provided

Authorization Error (403)
├── Insufficient permissions
└── Role mismatch

Not Found (404)
├── Resource doesn't exist
└── User not found

Server Error (500)
└── Unhandled exception
```

## Security Considerations

### Data Protection
- Passwords: Bcrypt hashing
- Sensitive data: Not logged or cached
- Images: Stored on Cloudinary (not local)

### API Security
- CORS: Configured origins only
- Rate limiting: Prevent brute force
- Helmet: HTTP headers hardening
- Input validation: All endpoints

### Token Security
- JWT Secret: Environment variable
- Expiration: 7 days default
- Signature verification: All requests
- No sensitive data in payload

### Database Security
- Connection: Encrypted (MongoDB Atlas)
- Indexes: Optimized for performance
- Backups: (Configure in production)

## Monitoring & Logging

### Current Implementation
- Console errors for debugging
- Error middleware catches all exceptions

### Recommended Additions
- Winston/Morgan for logging
- Sentry for error tracking
- NewRelic for performance monitoring
- ELK stack for centralized logging

---

**This architecture is production-ready and designed for scalability, maintainability, and security.**
