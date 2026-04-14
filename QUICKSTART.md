# Quick Start Guide

## 🚀 Start Everything in 5 Minutes

### 1. Terminal 1 - Server
```bash
cd "c:\Users\ISP\Desktop\Project\server"
npm install
npm run dev
```
✅ Server runs at: http://localhost:5000

### 2. Terminal 2 - Client
```bash
cd "c:\Users\ISP\Desktop\Project\client"
npm install
npm run dev
```
✅ Frontend runs at: http://localhost:5173

### 3. Open Browser
- Frontend: http://localhost:5173
- Admin: http://localhost:5173/admin/dashboard
- Client: http://localhost:5173/login

## 📋 Demo Accounts

### Admin Login
- Email: `admin@example.com`
- Password: `admin123`

### Client Login
- Email: `client@example.com`
- Password: `client123`

(Register new accounts via the frontend if these don't exist)

## 🗂️ Important Files

### Server
- `server/src/index.js` - Main server entry
- `server/src/models/` - Database schemas
- `server/src/routes/` - API endpoints
- `server/.env` - Configuration

### Client
- `client/src/pages/` - Application pages
- `client/src/services/api.ts` - API calls
- `client/src/components/` - Reusable components
- `client/.env` - Frontend config

## 📚 Key Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | / | Landing page |
| Portfolio | /portfolio | Project showcase |
| Services | /services | Service descriptions |
| Pricing | /pricing | Pricing tiers |
| Contact | /contact | Contact form |
| Client Login | /login | Client login |
| Client Dashboard | /client-dashboard | Project tracking |
| Billing | /client-dashboard/billing | Invoices & subscriptions |
| Admin Dashboard | /admin/dashboard | Admin stats |
| Manage Clients | /admin/clients | CRUD clients |

## 🔧 Troubleshooting

### Server won't start?
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000
# Kill process
taskkill /PID <PID> /F
```

### MongoDB error?
```bash
# Ensure MongoDB is running
mongod
# Or use MongoDB Atlas (cloud)
```

### Client can't connect to API?
- Check `client/.env` has `VITE_API_URL=http://localhost:5000/api`
- Ensure server is running
- Check browser console for errors

## 📝 Default Test Data

When you first login, create some test data:

### For Clients:
1. Create a project
2. Add an invoice
3. Check billing dashboard

### For Admin:
1. View dashboard stats
2. Add new client
3. Create projects for clients
4. Generate invoices

## 🎯 What's Included

✅ Full-stack authentication
✅ Project management
✅ Invoice & billing system
✅ Subscription management
✅ Admin portal
✅ Client portal
✅ Loading animations (Apple-style)
✅ Responsive design
✅ MongoDB integration
✅ JWT tokens
✅ RESTful API

## 📖 Full Documentation

See these files for detailed info:
- `FULL_STACK_SETUP.md` - Complete setup guide
- `server/README.md` - Backend documentation
- `README.md` - Project overview

Happy building! 🎨
