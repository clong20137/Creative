# Full-Stack Creative Portfolio Setup Guide

This document explains how to run both the client and server together and integrate with actual data.

## Project Structure

```
c:\Users\ISP\Desktop\Project\
├── server/                 # Express backend
│   ├── src/
│   │   ├── index.js       # Main server file
│   │   ├── models/        # MongoDB schemas
│   │   └── routes/        # API endpoints
│   ├── package.json
│   ├── .env              # Server configuration
│   └── README.md
│
├── client/               # React frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API calls
│   │   └── context/     # React context
│   ├── package.json
│   ├── .env            # Frontend configuration
│   └── vite.config.ts
│
└── src/                 # Original React files (keeping for reference)
```

## Prerequisites

1. **Node.js** (v16+) - [Download](https://nodejs.org/)
2. **MongoDB** - Either:
   - Local: [Download](https://www.mongodb.com/try/download/community)
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
3. **npm or yarn**

## Step 1: Set Up MongoDB

### Option A: Local MongoDB
```bash
# Install MongoDB Community Edition
# Then start the service:
mongod
```

### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/database`
4. Copy to `server/.env` as MONGODB_URI

## Step 2: Install Server Dependencies

```bash
cd "c:\Users\ISP\Desktop\Project\server"
npm install
```

This installs:
- Express.js - REST API framework
- Mongoose - MongoDB ODM
- JWT - Authentication
- bcrypt - Password hashing
- Stripe - Payment processing

## Step 3: Configure Server Environment

Update `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/creative-portfolio
JWT_SECRET=change-this-to-a-random-secret-string
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_PUBLIC_KEY=pk_test_xxxx
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
VITE_API_URL=http://localhost:5000/api
```

## Step 4: Install Client Dependencies

```bash
cd "c:\Users\ISP\Desktop\Project\client"
npm install
```

or copy existing files from src/ if not already copied

## Step 5: Start the Backend Server

```bash
cd "c:\Users\ISP\Desktop\Project\server"
npm run dev
```

Expected output:
```
🚀 Server running at http://localhost:5000
📡 MongoDB connected to: mongodb://localhost:27017/creative-portfolio
```

## Step 6: Start the Frontend in Another Terminal

```bash
cd "c:\Users\ISP\Desktop\Project\client"
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

## Key Features

### 1. **Authentication System**
- User registration and login
- JWT-based authentication
- Role-based access (client/admin)

### 2. **Client Portal**
Features:
- View projects and progress
- Download invoices
- Pay bills
- Manage subscriptions
- Track billing history

**Routes:**
- `/login` - Client login
- `/client-dashboard` - Main dashboard
- `/client-dashboard/billing` - Invoices & subscriptions

### 3. **Admin Portal**
Features:
- Dashboard with key metrics
- Manage clients
- View all projects
- Track invoices and payments
- Manage subscriptions
- Revenue analytics

**Routes:**
- `/admin/login` - Admin login
- `/admin/dashboard` - Dashboard
- `/admin/clients` - Manage clients
- `/admin/projects` - View projects
- `/admin/invoices` - Manage invoices
- `/admin/subscriptions` - Manage subscriptions

### 4. **Loading Animations**
- Skeleton screens for data loading
- Smooth page transitions (Apple-style)
- Shimmer effects
- Progress indicators

### 5. **Database Integration**
All data persists in MongoDB:
- Users (clients & admins)
- Projects (portfolio items)
- Invoices (billing records)
- Subscriptions (service plans)

## API Integration Examples

### Register User
```javascript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secure-password',
    company: 'Creative Co',
    role: 'client'
  })
})
const data = await response.json()
localStorage.setItem('authToken', data.token)
```

### Get Client Projects
```javascript
const token = localStorage.getItem('authToken')
const response = await fetch('http://localhost:5000/api/projects/client/USER_ID', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const projects = await response.json()
```

### Create Invoice
```javascript
const token = localStorage.getItem('authToken')
const response = await fetch('http://localhost:5000/api/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    clientId: 'client-id',
    items: [{ description: 'Web Design', quantity: 1, rate: 3500, amount: 3500 }],
    subtotal: 3500,
    total: 3500,
    dueDate: '2024-12-31'
  })
})
```

## Testing the System

### 1. Create a Test User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@example.com",
    "password":"Test123!",
    "company":"Test Co",
    "role":"client"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Test123!"
  }'
```

### 3. Create Project
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clientId":"USER_ID",
    "title":"Website Redesign",
    "category":"web-design",
    "status":"in-progress",
    "progress":50,
    "budget":5000
  }'
```

## Environment Variables Checklist

### Server (.env)
- [ ] MONGODB_URI configured
- [ ] JWT_SECRET set
- [ ] PORT matches (5000)
- [ ] Stripe keys added (optional for now)
- [ ] Email configured (optional)

### Client (.env)
- [ ] VITE_API_URL set to http://localhost:5000/api

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
# Update PORT in server/.env
```

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in .env
- Try local: `mongodb://localhost:27017/creative-portfolio`

### CORS Errors
- Backend uses CORS middleware configured for localhost
- For production, update CORS settings in server/src/index.js

### API Not Responding
- Check both servers are running
- Verify frontend .env has correct API_URL
- Check browser console for errors

## Next Steps

1. **Add Real Data:**
   - Upload actual portfolio projects
   - Create client accounts
   - Generate real invoices

2. **Payment Integration:**
   - Set up Stripe account
   - Add stripe keys to .env
   - Implement payment processing

3. **Email Notifications:**
   - Configure email service
   - Send invoice notifications
   - Payment confirmations

4. **Deploy:**
   - Server: Heroku, AWS, DigitalOcean
   - Client: Netlify, Vercel
   - Database: MongoDB Atlas

5. **Security:**
   - Change JWT_SECRET for production
   - Enable HTTPS
   - Set secure cookies
   - Add rate limiting

## Support

For issues or questions:
1. Check server logs: http://localhost:5000/api/health
2. Check browser console for frontend errors
3. Review MongoDB logs
4. Check .env variables are set correctly

Happy coding! 🚀
