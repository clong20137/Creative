# Backend Server Setup

This is the Express.js backend server for the Creative Portfolio website with admin and client portals.

## Prerequisites

- Node.js (v16+)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/creative-portfolio
JWT_SECRET=your-super-secret-jwt-key-change-this
STRIPE_SECRET_KEY=sk_test_your_key
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects/client/:clientId` - Get client projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Invoices
- `GET /api/invoices/client/:clientId` - Get client invoices
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `PUT /api/invoices/:id/pay` - Mark as paid
- `DELETE /api/invoices/:id` - Delete invoice

### Subscriptions
- `GET /api/subscriptions/client/:clientId` - Get client subscription
- `GET /api/subscriptions/:id` - Get single subscription
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `PUT /api/subscriptions/:id/cancel` - Cancel subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Portfolio
- `GET /api/portfolio` - Get all portfolio items
- `GET /api/portfolio/category/:category` - Get by category
- `GET /api/portfolio/:id` - Get single item

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/clients` - Get all clients
- `GET /api/admin/projects` - Get all projects
- `GET /api/admin/invoices` - Get all invoices
- `GET /api/admin/subscriptions` - Get all subscriptions
- `GET /api/admin/revenue/monthly` - Monthly revenue
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Database Schema

### User
```typescript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  company: String,
  role: 'client' | 'admin',
  avatar: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Project
```typescript
{
  clientId: ObjectId,
  title: String,
  description: String,
  category: 'web-design' | 'photography' | 'videography' | 'branding',
  status: 'pending' | 'in-progress' | 'completed' | 'on-hold',
  progress: Number (0-100),
  startDate: Date,
  dueDate: Date,
  budget: Number,
  spent: Number
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5000) |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Secret for JWT tokens |
| STRIPE_SECRET_KEY | Stripe API key |
| EMAIL_USER | Email for notifications |
| EMAIL_PASSWORD | Email password |

## Testing Endpoints

Using curl:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"password","role":"client"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"password"}'

# Get stats (requires token)
curl -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running locally or update MONGODB_URI with Atlas connection string
- Check network connectivity to database

**Port Already in Use:**
- Change PORT in .env to another port (e.g., 5001)
- Or kill process: `lsof -ti:5000 | xargs kill`

## Next Steps

1. Connect to actual MongoDB instance
2. Set up real Stripe account for payments
3. Configure email notifications
4. Set production JWT_SECRET
5. Deploy to cloud provider (Heroku, AWS, etc.)
