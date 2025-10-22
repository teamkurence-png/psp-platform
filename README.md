# PSP Platform

A complete Payment Service Provider platform with merchant onboarding, payment processing, manual reviews, settlements, and crypto withdrawals.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript + MongoDB + Mongoose + Socket.IO
- **Auth**: JWT with refresh tokens, 2FA support

## Features

### Completed Features
1. **Authentication & Authorization**
   - User registration and login
   - JWT-based authentication with refresh tokens
   - 2FA setup and verification
   - Role-based access control (Merchant, Ops, Finance, Admin)

2. **Merchant Onboarding**
   - Business profile management
   - Document upload system
   - Onboarding status workflow
   - Review and approval by Ops/Admin

3. **Merchant Dashboard**
   - Volume statistics (today/7d/30d)
   - Approval/decline metrics
   - Balance overview (available/pending)
   - Alerts and notifications
   - Quick action buttons

4. **Payment Requests**
   - Create payment requests with bank wire or card options
   - Customer information management
   - Payment method configuration
   - List and filter payment requests

5. **Transaction Management**
   - Transaction list with filters
   - Status tracking (Pending Review → Approved → Settled)
   - Merchant confirmation status
   - Risk scoring

### Backend API

All backend models and controllers are implemented:
- User authentication
- Merchant profile management
- Document uploads
- Payment requests
- Transactions
- Balances
- Settlements
- Crypto addresses & withdrawals
- Customers
- Notifications
- Settings

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/psp-platform

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

4. Start MongoDB:

**Option A - If you have MongoDB installed locally:**
```bash
mongod
```

**Option B - Use MongoDB Atlas (free cloud database):**
- Go to https://www.mongodb.com/cloud/atlas
- Create a free account and cluster
- Get your connection string
- Use it in your `.env` file

**Option C - Use Docker:**
```bash
docker run -d -p 27017:27017 --name psp-mongodb mongo:latest
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies (already done):
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## Usage

### First Time Setup

1. Open http://localhost:5173 in your browser
2. Click "Sign up" to create a new merchant account
3. Enter your business name, email, and password
4. You'll be automatically logged in to the dashboard

### Default User Roles

- **Merchant**: Can create payment requests, view transactions, manage balances
- **Ops**: Can review merchant applications, approve transactions
- **Finance**: Can view settlements and reconciliation
- **Admin**: Full access to all features

### Key Features to Test

1. **Dashboard**: View your business metrics and quick actions
2. **Payment Requests**: Create new payment requests for customers
3. **Transactions**: View and manage all payment transactions
4. **Manual Confirmations**: Confirm bank wire transfers (coming soon)
5. **Balances**: View available and pending balances (coming soon)
6. **Crypto Withdrawals**: Withdraw funds via cryptocurrency (coming soon)

## Project Structure

### Backend
```
backend/
├── src/
│   ├── config/         # Database and configuration
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth, RBAC, error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Helper functions
│   └── server.ts       # Main server file
└── package.json
```

### Frontend
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── layout/    # Layout components
│   │   └── ui/        # Basic UI components
│   ├── lib/           # Utilities and API client
│   ├── pages/         # Page components
│   ├── types/         # TypeScript types
│   ├── App.tsx        # Main app component
│   └── main.tsx       # Entry point
└── package.json
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA
- `POST /api/auth/2fa/disable` - Disable 2FA

### Merchant Endpoints
- `GET /api/merchants/profile` - Get merchant profile
- `PUT /api/merchants/profile` - Update merchant profile
- `POST /api/merchants/submit-review` - Submit for review
- `POST /api/merchants/documents` - Upload document
- `GET /api/merchants/documents` - Get documents

### Payment Request Endpoints
- `POST /api/payment-requests` - Create payment request
- `GET /api/payment-requests` - List payment requests
- `GET /api/payment-requests/:id` - Get payment request
- `PUT /api/payment-requests/:id` - Update payment request
- `POST /api/payment-requests/:id/cancel` - Cancel payment request

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start with hot reload
npm run build  # Build for production
npm start  # Run production build
```

### Frontend Development
```bash
cd frontend
npm run dev  # Start with hot reload
npm run build  # Build for production
npm run preview  # Preview production build
```

## Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Query (TanStack Query)
- React Hook Form
- Zod (validation)
- Lucide React (icons)
- Socket.IO Client
- Axios

### Backend
- Express
- TypeScript
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Socket.IO
- Multer (file uploads)
- Helmet (security)
- CORS
- Morgan (logging)
- Zod (validation)
- Speakeasy (2FA)

## Future Enhancements

- [ ] Complete manual confirmation workflow
- [ ] Implement crypto withdrawal system
- [ ] Add real-time notifications via Socket.IO
- [ ] Customer management pages
- [ ] Admin settings pages
- [ ] Email/SMS notifications
- [ ] Real payment gateway integration
- [ ] Blockchain provider integration
- [ ] Reporting and analytics
- [ ] Export functionality (CSV/PDF)
- [ ] Dark mode support
- [ ] Mobile app

## License

MIT

