# Getting Started Checklist

Complete this checklist to get your Intelligent House Renting System backend up and running.

## ✅ Pre-Setup Requirements

- [ ] Node.js installed (v14+)
- [ ] npm installed
- [ ] MongoDB account (create at mongodb.com/atlas)
- [ ] Cloudinary account (sign up at cloudinary.com)
- [ ] Text editor or IDE (VS Code recommended)
- [ ] Git installed (optional, for version control)

## ✅ Initial Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```
**Expected Output**: "added XXX packages" with no errors

### Step 2: Create Environment File
```bash
cp .env.example .env
```

### Step 3: Edit .env File
Open `.env` and fill in the required values:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intelligent_house_renting

# JWT
JWT_SECRET=generate_random_secret_key_here (min 32 chars)
JWT_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=development

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_account_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Hugging Face (optional)
HUGGING_FACE_API_KEY=your_api_key (optional)
HUGGING_FACE_MODEL=your_model_id (optional)

# CORS
CLIENT_URL=http://localhost:3000
```

## ✅ Database Setup (10 minutes)

### Step 1: Create MongoDB Cluster
1. Go to https://mongodb.com/atlas
2. Sign up or login
3. Create a new cluster (free tier OK)
4. Wait for cluster to be ready

### Step 2: Create Database User
1. In MongoDB Atlas: Security → Database Access
2. Create a new user with:
   - Username: `dbuser`
   - Password: `strong_password`
3. Grant "Read and write to any database" role

### Step 3: Get Connection String
1. In MongoDB Atlas: Clusters → Connect
2. Choose "Connect to your application"
3. Copy the connection string
4. Replace `<username>` and `<password>` with your credentials
5. Paste into `.env` as `MONGODB_URI`

**Example**:
```
mongodb+srv://dbuser:mypassword@cluster0.mongodb.net/intelligent_house_renting?retryWrites=true&w=majority
```

### Step 4: Whitelist IP
1. In MongoDB Atlas: Security → Network Access
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (for development)
4. **For production**: Add specific server IP

## ✅ Cloudinary Setup (5 minutes)

### Step 1: Create Cloudinary Account
1. Go to https://cloudinary.com/users/register/free
2. Sign up and verify email
3. Go to Dashboard

### Step 2: Get API Credentials
1. On Dashboard, note:
   - Cloud Name
   - API Key
   - API Secret (click to reveal)

### Step 3: Update .env
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## ✅ JWT Secret Generation (2 minutes)

Generate a secure random string for `JWT_SECRET`:

### Option 1: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: Using Online Generator
Use https://generate-random.org/api-token-generator (copy first 32 chars)

### Step: Update .env
```env
JWT_SECRET=your_generated_secret_here
```

## ✅ Hugging Face Setup (Optional - 3 minutes)

### Step 1: Create Account (if needed)
1. Go to https://huggingface.co/settings/tokens
2. Sign up if you don't have account
3. Create a new token

### Step 2: Update .env
```env
HUGGING_FACE_API_KEY=your_token_here
HUGGING_FACE_MODEL=your_model_id_here
```

**Note**: Without this, recommendations still work with database filtering only.

## ✅ Start Development Server

### Step 1: Run Server
```bash
npm run dev
```

### Step 2: Check for Success
You should see:
```
MongoDB Connected: cluster0.mongodb.net
Server running on http://localhost:3000
```

### Step 3: Test Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running"
}
```

## ✅ Test Basic API (15 minutes)

Follow the **QUICKSTART.md** file:

### Test 1: Register User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "role": "tenant"
  }'
```

**Save the token from response**.

### Test 2: Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Verify you get a token**.

### Test 3: Get User Profile
```bash
curl http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer TOKEN_FROM_RESPONSE"
```

**Replace USER_ID and TOKEN with actual values**.

## ✅ Explore Full API

### Use Postman for Better Experience

1. Download Postman: https://www.postman.com/downloads/
2. Import the collection from **QUICKSTART.md**
3. Set environment variable: `{{token}}`
4. Test all endpoints

### Or Continue with cURL

See **QUICKSTART.md** for all cURL examples:
- Create properties (as landlord)
- Browse properties (as tenant)
- Create bookings
- Leave reviews
- Get recommendations

## ✅ Document Structure Understanding

Read these documents in order:

1. **README.md** (5 min read)
   - Overview and quick start

2. **QUICKSTART.md** (15 min read)
   - Testing guide with examples

3. **API_DOCUMENTATION.md** (20 min read)
   - Complete endpoint reference

4. **ARCHITECTURE.md** (20 min read)
   - System design and data models

5. **DEPLOYMENT.md** (15 min read)
   - Production deployment guide

6. **IMPLEMENTATION_SUMMARY.md** (10 min read)
   - Feature checklist and statistics

## ✅ Common Issues & Solutions

### Issue: "Cannot find module 'dotenv'"
**Solution**: Run `npm install` again to ensure all packages installed

### Issue: "MongoDB connection failed"
**Solution**: 
- Verify MONGODB_URI is correct
- Check username/password in connection string
- Verify IP is whitelisted in MongoDB Atlas

### Issue: "Cloudinary upload failed"
**Solution**:
- Verify CLOUDINARY_CLOUD_NAME is correct
- Check API key and secret are correct
- Ensure folder structure exists in Cloudinary

### Issue: "Cannot POST /api/users/register"
**Solution**: Server may not be running. Check:
- Terminal shows "Server running on http://localhost:3000"
- No errors in console

### Issue: "Invalid token"
**Solution**:
- Token may have expired (refresh by login again)
- JWT_SECRET in .env must match what's in code
- Token format must be "Bearer {token}" with space

## ✅ Next Steps

### For Frontend Integration
1. ✅ Save user IDs from `/api/users/register`
2. ✅ Use property IDs from `/api/properties`
3. ✅ Store JWT token in localStorage
4. ✅ Include token in all protected requests

### For Testing & QA
1. ✅ Test all 40+ endpoints
2. ✅ Verify role-based access
3. ✅ Test error cases
4. ✅ Verify data relationships

### For Deployment
1. Read **DEPLOYMENT.md**
2. Choose deployment platform (Heroku, AWS, Docker)
3. Set production environment variables
4. Deploy and monitor

## ✅ Useful Commands

### Development
```bash
npm run dev       # Start with auto-reload
npm start         # Start server once
```

### Debugging
```bash
# View server logs in real-time
npm run dev

# Test specific endpoint
curl http://localhost:3000/api/health

# View MongoDB data
# Use MongoDB Atlas UI or MongoDB Compass
```

### Cleaning Up (if needed)
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear all data (careful!)
# In MongoDB Atlas: Delete cluster
# Then create new cluster
```

## ✅ API Testing Tools

### Command Line
- **cURL** (built-in, examples in QUICKSTART.md)
- **httpie** (`pip install httpie`)

### GUI Tools
- **Postman** (https://www.postman.com/downloads/)
- **Insomnia** (https://insomnia.rest/)
- **VS Code REST Client** (extension)

### Recommended: Postman
Best experience with:
- Visual interface
- Environment variables
- Pre-request scripts
- Test scripts
- History

## ✅ Success Criteria

You'll know setup is complete when:

- [ ] `npm run dev` starts without errors
- [ ] `/api/health` returns success
- [ ] Can register new user
- [ ] Can login and receive token
- [ ] Can access protected routes with token
- [ ] Cannot access protected routes without token
- [ ] Database shows created users
- [ ] Error handling works correctly

## ✅ Troubleshooting Checklist

Having issues? Check this:

- [ ] All .env variables are filled (no empty values)
- [ ] Node.js version is 14+ (`node --version`)
- [ ] MongoDB connection string is correct
- [ ] MongoDB cluster is active
- [ ] Cloudinary credentials are correct
- [ ] Port 3000 is not used by another app
- [ ] All dependencies installed (`npm install`)
- [ ] No typos in command lines
- [ ] Terminal is in correct directory (`backend/`)
- [ ] Server shows "MongoDB Connected" message

## ✅ Support Resources

If you get stuck:

1. **Check QUICKSTART.md** for testing examples
2. **Check API_DOCUMENTATION.md** for endpoint specs
3. **Check ARCHITECTURE.md** for data model understanding
4. **Check console output** for error messages
5. **Check MongoDB logs** in Atlas dashboard
6. **Search error message** online

## ✅ Final Checklist

Before moving to production:

- [ ] Tested all major endpoints
- [ ] Tested with different user roles
- [ ] Verified authentication works
- [ ] Verified authorization works
- [ ] Tested error cases
- [ ] Images upload to Cloudinary correctly
- [ ] Bookings flow works end-to-end
- [ ] Reviews can be created and displayed
- [ ] Database indexes are created
- [ ] No console.log statements for production
- [ ] Ready for frontend integration

## 🚀 You're Ready!

Once all checkboxes are complete:

1. You have a fully functional backend
2. You can test all endpoints
3. You're ready to integrate with frontend
4. You're ready to deploy to production

**Time to complete this checklist: ~45-60 minutes**

Next: Read API_DOCUMENTATION.md for complete endpoint reference!

---

**Questions?** Refer to the documentation or check the code comments.

**Happy coding!** 🎉
