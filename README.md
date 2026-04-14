# Creative Studio Portfolio - Full Stack Solution

A modern, production-ready portfolio website for creative businesses with dual portals (admin & client), real database integration, and Apple-style loading animations.

## 🎯 Key Features

### Core Portfolio
✅ **Modern React SPA** - Built with React 18, TypeScript, Vite  
✅ **Express Backend** - RESTful API with MongoDB integration  
✅ **Portfolio Gallery** - Filterable gallery with 8+ sample projects  
✅ **Client Testimonials** - Professional testimonials section  
✅ **Service Descriptions** - Web Design, Photography, Videography, Branding  
✅ **Pricing Page** - 3 service tiers with detailed features  
✅ **Contact Form** - Professional contact form  

### Admin Portal
✅ **Dashboard** - Key metrics (clients, projects, revenue)  
✅ **Client Management** - Create, edit, delete clients  
✅ **Project Tracking** - View all projects with status  
✅ **Invoice Management** - Track all invoices and payments  
✅ **Subscription Management** - Manage client subscriptions  
✅ **Revenue Analytics** - Monthly revenue reports  

### Client Portal
✅ **Project Dashboard** - Track project progress  
✅ **Invoice Management** - View and pay invoices  
✅ **Billing History** - Access payment records  
✅ **Subscription Management** - Update subscription plans  
✅ **Download Invoices** - Export invoice PDFs  

### Advanced Features
✅ **Apple-Style Loading Animations** - Smooth transitions & skeleton screens  
✅ **JWT Authentication** - Secure token-based auth  
✅ **Role-Based Access** - Admin/Client separation  
✅ **Real Database** - MongoDB integration  
✅ **Responsive Design** - Works on all devices  

## 🏗️ Tech Stack

### Frontend
- React 18, TypeScript, Vite, Tailwind CSS
- React Router v6, Axios, React Icons

### Backend
- Node.js, Express.js, MongoDB, Mongoose
- JWT, bcryptjs, CORS

### Deployment Ready
- Netlify (frontend), Heroku/AWS (backend), MongoDB Atlas (DB)

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js v16+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Start Backend
```bash
cd server
npm install
npm run dev
```
✅ Server runs at http://localhost:5000

### Start Frontend  
In a new terminal:
```bash
cd client
npm install
npm run dev
```
✅ Frontend runs at http://localhost:5173

### Open Browser
- Landing: http://localhost:5173
- Admin: http://localhost:5173/admin/dashboard
- Client: http://localhost:5173/login

**See `QUICKSTART.md` for detailed instructions**

## 📁 Project Structure

```
Project/
├── server/                    # Express Backend
│   ├── src/
│   │   ├── index.js
│   │   ├── models/           # Database schemas
│   │   └── routes/           # API endpoints
│   ├── .env
│   └── package.json
│
├── client/                    # React Frontend
│   ├── src/
│   │   ├── pages/           # Application pages
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API client
│   │   └── context/         # React context
│   ├── .env
│   └── package.json
│
├── QUICKSTART.md             # 5-minute guide
├── FULL_STACK_SETUP.md       # Complete setup
└── README.md                 # This file
```

## 📚 Key Pages

| Page | URL | Type | Description |
|------|-----|------|-------------|
| Home | / | Public | Landing page |
| Portfolio | /portfolio | Public | Project showcase |
| Services | /services | Public | Service offerings |
| Pricing | /pricing | Public | Pricing tiers |
| Contact | /contact | Public | Contact form |
| Client Login | /login | Client | Client authentication |
| Client Dashboard | /client-dashboard | Client | Project tracking |
| Billing | /client-dashboard/billing | Client | Invoices & subscriptions |
| Admin Panel | /admin/dashboard | Admin | Dashboard stats |
| Manage Clients | /admin/clients | Admin | CRUD clients |

## 🔐 Authentication

### Client Portal
- Login with email/password
- View assigned projects
- Pay invoices
- Manage subscription
- Download receipts

### Admin Portal
- Admin-only access
- Manage all clients
- Create projects & invoices
- Track payments
- View analytics

## 💳 Billing Features

- **Invoices**: Create, send, track, and pay
- **Subscriptions**: Multiple tiers (Starter, Professional, Enterprise)
- **Payment Tracking**: View payment history
- **Billing Reminders**: Auto-generated reminders
- **Invoice Export**: Download PDF invoices

## 🎨 Apple-Style Loading Animations

✅ Skeleton screens while loading data  
✅ Smooth page transitions  
✅ Shimmer effects on placeholders  
✅ Progress indicators  
✅ Fade-in animations  
✅ Responsive loading states  

## 🌐 API Endpoints

**Note:** All endpoints except public ones require JWT token

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Projects
```
GET    /api/projects/client/:id
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
```

### Invoices
```
GET    /api/invoices/client/:id
POST   /api/invoices
PUT    /api/invoices/:id/pay
DELETE /api/invoices/:id
```

### Subscriptions
```
GET    /api/subscriptions/client/:id
POST   /api/subscriptions
PUT    /api/subscriptions/:id/cancel
```

### Admin
```
GET    /api/admin/stats
GET    /api/admin/clients
GET    /api/admin/projects
GET    /api/admin/invoices
GET    /api/admin/subscriptions
```

See `server/README.md` for full API documentation

## 🛠️ Configuration

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/creative-portfolio
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_xxxx
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🚢 Deployment

### Frontend (Netlify)
```bash
npm run build
# Deploy dist/ to Netlify
```

### Backend (Heroku/AWS)
```bash
npm run build
npm start
```

### Database (MongoDB Atlas)
- Create free cluster
- Get connection string
- Update MONGODB_URI in production .env

## 📖 Documentation

- **QUICKSTART.md** - Get started in 5 minutes
- **FULL_STACK_SETUP.md** - Complete integration guide  
- **server/README.md** - Backend API documentation

## 🧪 Testing

### Create Test Admin
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Admin",
    "email":"admin@test.com",
    "password":"admin123",
    "role":"admin"
  }'
```

### Create Test Client
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Client",
    "email":"client@test.com",
    "password":"client123",
    "role":"client"
  }'
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- Use MongoDB Atlas for cloud option

### API Not Responding
- Verify backend is running on port 5000
- Check `client/.env` has correct API_URL
- Review server logs for errors

## 📋 Environment Checklist

Backend:
- [ ] Node.js v16+ installed
- [ ] MongoDB running or Atlas connected
- [ ] `server/.env` configured
- [ ] All dependencies installed

Frontend:
- [ ] Node.js v16+ installed
- [ ] `client/.env` configured
- [ ] VITE_API_URL points to backend
- [ ] All dependencies installed

## 🚀 Next Steps

1. **Add Real Data** - Upload portfolio projects
2. **Setup Payments** - Integrate Stripe for real payments
3. **Email Notifications** - Configure automated emails
4. **Deploy** - Push to production servers
5. **Monitor** - Setup error logging and analytics

## 📞 Support

Issues? Check:
1. `FULL_STACK_SETUP.md` for detailed setup
2. `server/README.md` for API details
3. Browser console for client errors
4. Server logs: `http://localhost:5000/api/health`

## 📄 License

This project is proprietary and confidential.

---

**Built with ❤️ using React, Express, and MongoDB**

Happy coding! 🚀
