# Deployment Guide for Omukweyo

## 🚀 Production Deployment Configuration

### For Node.js Hosting (Plesk, cPanel, etc.)

#### 1. Application Settings

Based on your hosting configuration screen:

- **Node.js Version**: 24.18.0 ✅ (Already configured)
- **Package Manager**: npm ✅ (Already configured)
- **Application Mode**: production ✅ (Already configured)
- **Application URL**: http://omukweyo.com ✅
- **Application Startup File**: `app.js` ✅ (Now created)

#### 2. Document Root Configuration

**Important Security Note**: Your document root should point to the built frontend files:

- **Recommended**: `/httpdocs/apps/web/dist`
- **Current**: `/httpdocs` ⚠️ (This exposes your source code - CHANGE THIS!)

The built files are in `apps/web/dist/` after running `npm run build`.

#### 3. Environment Variables

Click **[specify]** next to "Custom environment variables" and add these:

```
NODE_ENV=production
PORT=4000
DATABASE_URL=mysql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST:3306/omukweyo
WEB_ORIGIN=http://omukweyo.com
UPLOAD_BASE_URL=http://omukweyo.com/uploads
VITE_API_URL=http://omukweyo.com
VITE_WS_URL=http://omukweyo.com
```

**Important**: Replace the `DATABASE_URL` with your actual MySQL credentials.

#### 4. Build Process

Before deploying, ensure you've built the project:

```bash
npm install
npm run build
```

**⚠️ Important for Linux Servers**: If your production server is Linux and you develop on Windows, install production dependencies with:

```bash
npm install --production --no-optional
```

This skips Windows-specific packages like `@esbuild/win32-x64` that cause "EBADPLATFORM" errors.

This creates:
- `apps/api/dist/` - Compiled API server
- `apps/web/dist/` - Built frontend (HTML, CSS, JS)
- `packages/shared/dist/` - Compiled shared types

#### 5. Database Setup

On your production server:

```bash
# Push the schema to create tables
npm run db:push

# (Optional) Seed with demo data
npm run db:seed
```

#### 6. File Structure After Deployment

Your production server should have:

```
/httpdocs/
├── app.js                    ← Entry point (created ✅)
├── package.json              ← Dependencies
├── apps/
│   ├── api/
│   │   ├── dist/            ← Compiled API (from build)
│   │   ├── prisma/          ← Database schema
│   │   └── uploads/         ← User uploaded files
│   └── web/
│       └── dist/            ← Built frontend (DOCUMENT ROOT)
├── packages/
│   └── shared/
│       └── dist/            ← Compiled shared types
└── node_modules/            ← Installed dependencies
```

#### 7. Port Configuration

Your hosting may assign a different port. The API will use the `PORT` environment variable if set, defaulting to 4000.

Make sure:
- Your application listens on the assigned port
- Update `WEB_ORIGIN`, `VITE_API_URL`, and `VITE_WS_URL` accordingly

#### 8. SSL/HTTPS Configuration

For production with SSL:

Update environment variables to use `https://`:
```
WEB_ORIGIN=https://omukweyo.com
UPLOAD_BASE_URL=https://omukweyo.com/uploads
VITE_API_URL=https://omukweyo.com
VITE_WS_URL=https://omukweyo.com
```

#### 9. Uploads Directory

Ensure the uploads directory is writable:

```bash
mkdir -p apps/api/uploads
chmod 755 apps/api/uploads
```

Or set a custom path via environment variable:
```
UPLOAD_DIR=/absolute/path/to/uploads
```

#### 10. Static File Serving

The Express API server (`apps/api/dist/index.js`) automatically serves:
- Frontend from `apps/web/dist/` at the root path
- Uploads from `apps/api/uploads/` at `/uploads`

#### 11. Restart Application

After configuration:
1. Click the restart button in your hosting control panel
2. Or restart via SSH: `npm start` or as configured

#### 12. Health Check

Once deployed, verify:
- API health: `http://omukweyo.com/api/health`
- Frontend: `http://omukweyo.com/`
- WebSocket: Check browser console for Socket.IO connection

## 🔧 Troubleshooting

### Application Won't Start

**Error**: "EBADPLATFORM" or "Unsupported platform for @esbuild/win32-x64"
- ✅ **Solution**: Install with `npm install --production --no-optional`
- This skips Windows-specific optional dependencies on Linux servers

**Error**: "app.js does not exist"
- ✅ **Fixed**: `app.js` is now created

**Error**: "Cannot find module"
- Run: `npm install` on the production server
- Ensure `node_modules/` exists

**Error**: "Database connection failed"
- Check `DATABASE_URL` environment variable
- Verify MySQL is accessible from your server
- Check credentials and database name

### Document Root Issues

**Problem**: Source code is exposed
- **Solution**: Change document root to `/httpdocs/apps/web/dist`

**Problem**: API endpoints not working
- The API runs on the Node.js application port
- Make sure your hosting proxies requests properly
- Check if `/api/*` routes are being forwarded

### Port Conflicts

**Problem**: Port already in use
- Your host may assign a specific port
- Use the PORT environment variable
- Don't hardcode ports

### File Upload Issues

**Problem**: Uploads fail
- Check uploads directory exists and is writable
- Verify `UPLOAD_DIR` or default `apps/api/uploads` is accessible
- Check file size limits (default: 3MB)

## 📝 Pre-Deployment Checklist

- [ ] Built the project (`npm run build`)
- [ ] Created production environment variables
- [ ] Set up MySQL database
- [ ] Ran database migrations (`npm run db:push`)
- [ ] Changed document root to `/httpdocs/apps/web/dist`
- [ ] Created `app.js` startup file (✅ Done)
- [ ] Configured SSL if available
- [ ] Set up uploads directory with correct permissions
- [ ] Tested database connection
- [ ] Verified all environment variables are set

## 🎯 Quick Deploy Steps

1. **Upload files** to `/httpdocs/` via FTP/SFTP
2. **SSH into server** (if available)
3. **Install dependencies**: `npm install --production --no-optional`
4. **Build project** (if not built locally): `npm run build`
5. **Set environment variables** in hosting control panel
6. **Update document root** to `apps/web/dist`
7. **Set startup file** to `app.js`
8. **Push database schema**: `npm run db:push`
9. **Restart application** via control panel
10. **Test**: Visit your URL and check `/api/health`

## 🔐 Security Recommendations

1. **Never expose .env files** - Add to .gitignore (already done)
2. **Use strong database passwords**
3. **Enable SSL/HTTPS** for production
4. **Set document root correctly** - Only serve built files
5. **Keep dependencies updated** - Run `npm audit` regularly
6. **Monitor logs** - Check application logs regularly
7. **Backup database** - Regular automated backups

## 📚 Additional Resources

- Main README: `README.md`
- Setup Guide: `SETUP.md`
- API Documentation: Check `/api/health` endpoint
- Support: Check hosting provider documentation for Node.js apps

## 🎉 After Successful Deployment

Your app will be available at:
- **Homepage**: http://omukweyo.com/
- **Business Directory**: http://omukweyo.com/businesses
- **API Health**: http://omukweyo.com/api/health
- **Company Pages**: http://omukweyo.com/c/{company-slug}
- **Dashboard**: http://omukweyo.com/dashboard
