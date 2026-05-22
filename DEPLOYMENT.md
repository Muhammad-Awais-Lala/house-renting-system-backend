# Deployment & Production Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Deployment](#database-deployment)
4. [Server Deployment](#server-deployment)
5. [Security Hardening](#security-hardening)
6. [Monitoring & Logging](#monitoring--logging)
7. [Performance Optimization](#performance-optimization)
8. [Disaster Recovery](#disaster-recovery)

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] No console.log statements (use proper logging)
- [ ] Error handling for all async operations
- [ ] No hardcoded secrets in code
- [ ] Code reviewed by team
- [ ] Dependencies updated and checked

### Security
- [ ] All input validation in place
- [ ] HTTPS enabled
- [ ] JWT secret is strong and random
- [ ] Password hashing implemented
- [ ] SQL injection/NoSQL injection prevented
- [ ] CORS properly configured
- [ ] Rate limiting configured
- [ ] Sensitive data not logged

### Configuration
- [ ] Environment variables documented
- [ ] Database connection tested
- [ ] Cloudinary credentials verified
- [ ] Hugging Face API key validated
- [ ] Email configuration ready (if used)

### Testing
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] API endpoints tested
- [ ] Authentication flow tested
- [ ] Error cases handled
- [ ] Load testing completed

## Environment Configuration

### Production .env File

```env
# Server
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intelligent_house_renting?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_extremely_long_random_secret_key_min_32_chars
JWT_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Hugging Face
HUGGING_FACE_API_KEY=your_api_key
HUGGING_FACE_MODEL=your_model_id

# CORS
CLIENT_URL=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Email (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=another_long_random_secret_key
```

### Secure Secret Generation

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Session Secret
openssl rand -base64 32
```

## Database Deployment

### MongoDB Atlas Setup

1. **Create Cluster**
   - Provider: AWS/Google Cloud/Azure
   - Region: Choose closest to users
   - Cluster Tier: M2/M5 for production

2. **Security Configuration**
   - Create database user with strong password
   - Enable IP whitelist (restrict to server IP)
   - Enable encryption at rest
   - Enable TLS/SSL

3. **Backup Configuration**
   ```
   Atlas → Clusters → Backup → Enable Continuous Cloud Backup
   ```

4. **Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
   ```

5. **Create Indexes for Production**
   ```javascript
   // Run in MongoDB shell or via Atlas UI
   
   // User indexes
   db.users.createIndex({ email: 1 }, { unique: true })
   
   // Property indexes
   db.properties.createIndex({ latitude: 1, longitude: 1 })
   db.properties.createIndex({ price: 1 })
   db.properties.createIndex({ location: "text", title: "text", description: "text" })
   db.properties.createIndex({ landlordId: 1 })
   
   // Booking indexes
   db.bookings.createIndex({ tenantId: 1, propertyId: 1 })
   db.bookings.createIndex({ landlordId: 1 })
   db.bookings.createIndex({ propertyId: 1 })
   db.bookings.createIndex({ status: 1 })
   
   // Review indexes
   db.reviews.createIndex({ propertyId: 1, rating: 1 })
   db.reviews.createIndex({ tenantId: 1 })
   db.reviews.createIndex({ propertyId: 1, tenantId: 1 }, { unique: true })
   ```

6. **Monitor Database**
   - Atlas → Monitoring → RAM/CPU usage
   - Atlas → Logs → Check for errors
   - Set up alerts for high usage

## Server Deployment

### Option 1: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Add environment variables
heroku config:set JWT_SECRET="your_secret"
heroku config:set MONGODB_URI="your_mongo_uri"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 2: AWS EC2

```bash
# Connect to EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Clone repository
git clone your-repo-url
cd backend

# Install dependencies
npm install

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

### Option 3: Docker Deployment

**Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "server.js"]
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    
  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS}
    restart: unless-stopped

volumes:
  mongo_data:
```

## Security Hardening

### 1. HTTP to HTTPS Conversion

```javascript
// In server.js
const fs = require('fs');
const https = require('https');
const express = require('express');

// Redirect HTTP to HTTPS
const redirectApp = express();
redirectApp.use((req, res) => {
  res.redirect(`https://${req.header('host')}${req.url}`);
});
redirectApp.listen(80);

// HTTPS Server
const options = {
  key: fs.readFileSync('/path/to/private.key'),
  cert: fs.readFileSync('/path/to/certificate.crt')
};

https.createServer(options, app).listen(3000);
```

### 2. Helmet Configuration

```javascript
// Enhanced Helmet configuration
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));
```

### 3. Rate Limiting Enhancement

```javascript
const rateLimit = require('express-rate-limit');

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later.'
});

app.post('/api/users/login', authLimiter, loginHandler);
app.post('/api/users/register', authLimiter, registerHandler);

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', apiLimiter);
```

### 4. Input Sanitization

```javascript
const validator = require('express-validator');

// Example for property creation
app.post('/api/properties',
  body('title').trim().isLength({ min: 5, max: 100 }),
  body('price').isFloat({ min: 0 }),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

## Monitoring & Logging

### Winston Logger Setup

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'house-renting-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### PM2 Monitoring

```bash
# Install PM2 Plus for monitoring
npm install -g pm2-plus

# Connect to PM2 Plus
pm2 plus

# Monitor in real-time
pm2 monit
```

### Health Check Endpoint

```javascript
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date(),
    database: 'Connected', // Verify DB connection
    uptime: process.uptime()
  });
});
```

## Performance Optimization

### 1. Database Query Optimization

```javascript
// Use projection to reduce data transfer
Property.find()
  .select('title price location images')
  .lean() // Returns plain JS objects (faster)
  .limit(10);

// Use indexes for frequent queries
Property.find({ landlordId: userId })
  .sort({ createdAt: -1 });

// Batch operations
User.insertMany(users, { ordered: false });
```

### 2. Caching Strategy

```javascript
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// Cache frequently accessed properties
app.get('/api/properties/:id', async (req, res) => {
  const cached = await client.get(`property:${req.params.id}`);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const property = await Property.findById(req.params.id);
  
  // Cache for 1 hour
  client.setex(`property:${req.params.id}`, 3600, JSON.stringify(property));
  
  res.json(property);
});
```

### 3. Compression

```javascript
const compression = require('compression');

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between compression and speed
}));
```

### 4. Connection Pooling

```javascript
// MongoDB automatically handles connection pooling
// Configure in connection string:
// mongodb+srv://user:pass@cluster.mongodb.net/db?maxPoolSize=50
```

## Disaster Recovery

### Backup Strategy

```bash
# Automated MongoDB backup
mongodump --uri "mongodb+srv://..." --out ./backup

# Or use Atlas automated backups (built-in)
# Configure in Atlas → Backup Settings
```

### Restore Procedure

```bash
mongorestore --uri "mongodb+srv://..." ./backup
```

### Error Recovery

```javascript
// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown');
  
  // Close database connection
  await mongoose.connection.close();
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.log('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});
```

## Scaling Considerations

### Horizontal Scaling

```
┌─────────────┐
│ Load        │
│ Balancer    │
│ (Nginx)     │
└─────┬───────┘
      │
   ┌──┴─────┬─────────┬──────────┐
   │        │         │          │
┌──▼───┐ ┌──▼───┐ ┌──▼───┐ ┌───▼──┐
│App 1 │ │App 2 │ │App 3 │ │App n │
└──┬───┘ └──┬───┘ └──┬───┘ └───┬──┘
   │        │        │         │
   └────────┼────────┼─────────┘
            │
        ┌───▼────────┐
        │  MongoDB   │
        │  Cluster   │
        └────────────┘
```

### Nginx Configuration

```nginx
upstream api {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    location /api {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Monitoring Checklist

- [ ] CPU usage < 80%
- [ ] Memory usage < 85%
- [ ] Database response time < 100ms
- [ ] API response time < 500ms
- [ ] Error rate < 0.1%
- [ ] No 5xx errors
- [ ] All health checks passing
- [ ] SSL certificate valid
- [ ] Backups running successfully

## Maintenance Tasks

### Weekly
- [ ] Check error logs
- [ ] Verify backups completed
- [ ] Monitor resource usage
- [ ] Check security alerts

### Monthly
- [ ] Review database indexes
- [ ] Update dependencies
- [ ] Analyze API performance metrics
- [ ] Security audit

### Quarterly
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Update security patches
- [ ] Review and optimize database

## Support & Troubleshooting

### Common Issues

**High Memory Usage**
```bash
# Find memory leak
node --inspect server.js

# Use Chrome DevTools
# chrome://inspect
```

**Database Connection Issues**
```javascript
// Add connection retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed, retrying in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};
```

**High API Latency**
- Check database indexes
- Implement caching
- Optimize queries
- Scale horizontally

---

**Your production system is ready to deploy!** 🚀

For questions or issues, refer to your DevOps team or check the main README.
