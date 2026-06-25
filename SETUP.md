# Omukweyo Setup Guide

## ✅ Completed Steps

1. ✅ Installed all dependencies
2. ✅ Created `.env` file from `.env.example`

## 🔧 Next Steps

### 1. Database Setup (MySQL)

You need to set up a MySQL database. You have two options:

#### Option A: Local MySQL Installation
1. Install MySQL locally (if not already installed)
2. Create a database named `omukweyo`:
   ```sql
   CREATE DATABASE omukweyo;
   ```
3. Update the `DATABASE_URL` in your `.env` file:
   ```
   DATABASE_URL="mysql://root:your_password@localhost:3306/omukweyo"
   ```

#### Option B: Use a Cloud MySQL Service
Services like PlanetScale, Railway, or AWS RDS provide free tiers:
1. Create a MySQL database
2. Copy the connection string
3. Update `DATABASE_URL` in `.env` with your connection string

### 2. Push Database Schema

After configuring your database, run:
```bash
npm run db:push
```

This will create all the tables based on your Prisma schema.

### 3. Seed the Database (Optional)

To populate your database with demo data:
```bash
npm run db:seed
```

### 4. Start the Development Server

Run both the API and Web app:
```bash
npm run dev
```

This will start:
- API server on http://localhost:4000
- Web app on http://localhost:5173

## 📝 Environment Variables

Your `.env` file is already created. Here's what needs to be configured:

### Required:
- `DATABASE_URL`: Your MySQL connection string
  - Format: `mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME`
  - Example: `mysql://root:password123@localhost:3306/omukweyo`

### Already Configured (defaults):
- `PORT=4000` - API server port
- `WEB_ORIGIN=http://localhost:5173` - Frontend URL
- `VITE_API_URL=http://localhost:4000` - API URL for frontend
- `VITE_WS_URL=http://localhost:4000` - WebSocket URL for real-time updates
- `UPLOAD_BASE_URL=http://localhost:4000/uploads` - File upload URL

## 🧪 Running Tests

```bash
# Run all contract tests
npm run test

# Run only web tests
npm run test:web

# Run only API tests
npm run test:api
```

## 🚀 Production Build

```bash
npm run build
```

This builds both the API and web app for production.

## 📦 Available Scripts

- `npm run dev` - Run both API and web in development mode
- `npm run dev:api` - Run only API server
- `npm run dev:web` - Run only web app
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with demo data
- `npm run start:api` - Start API in production mode
- `npm run preview:web` - Preview production build locally

## 🎯 Access Points After Setup

Once running with `npm run dev`:

- **Marketing Site**: http://localhost:5173/
- **Live Demo**: http://localhost:5173/c/bank-windhoek
- **Ticket Status**: http://localhost:5173/ticket
- **Staff Console**: http://localhost:5173/staff
- **Dashboard**: http://localhost:5173/dashboard
- **API**: http://localhost:4000

## ⚠️ Security Note

The vulnerabilities shown during npm install are in development dependencies and are not a concern for production. You can run `npm audit fix` if desired, but it's optional.

## 🐛 Troubleshooting

### Port Already in Use
If port 4000 or 5173 is already in use:
- Change `PORT` in `.env` for the API
- The web app will automatically find an available port

### Database Connection Error
- Verify MySQL is running
- Check your DATABASE_URL credentials
- Ensure the database exists

### Module Not Found Errors
Try reinstalling dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, React Router
- **Backend**: Express, TypeScript, Socket.IO, Prisma ORM
- **Database**: MySQL
- **Real-time**: WebSocket (Socket.IO)
- **Authentication**: JWT (mock implementation)

## 🎨 Demo Accounts (After Seeding)

The seed script will create demo accounts for testing different roles. Check `apps/api/prisma/seed.ts` for credentials.

## Need Help?

Check the README.md for more information about the architecture and features.
