# 🐧 Linux Server Deployment Fix

## The Problem

You're getting this error on your Linux server:

```
npm error code EBADPLATFORM
npm error notsup Unsupported platform for @esbuild/win32-x64@0.28.1
npm error notsup wanted {"os":"win32","cpu":"x64"} 
npm error notsup (current: {"os":"linux","cpu":"x64"})
```

## Why This Happens

- You developed on **Windows** and installed dependencies there
- `@esbuild/win32-x64` is a Windows-specific package
- Your **production server is Linux**, which can't use Windows packages
- npm tries to install ALL dependencies, including Windows-only ones

## ✅ The Solution

I've already fixed the `package.json` to make this package optional. Now on your Linux server, install with:

```bash
npm install --production --no-optional
```

### What This Does:
- `--production`: Skips devDependencies (faster, smaller)
- `--no-optional`: Skips optional dependencies (like Windows-specific packages)

## 📋 Complete Linux Deployment Steps

### 1. Upload Your Files

Upload these to `/var/www/vhosts/omukweyo.com/httpdocs/`:
- `apps/` directory (with built `dist` folders)
- `packages/` directory
- `app.js`
- `package.json`
- `package-lock.json`

### 2. SSH Into Your Server

```bash
ssh user@omukweyo.com
cd /var/www/vhosts/omukweyo.com/httpdocs
```

### 3. Install Dependencies (Fixed Command)

```bash
npm install --production --no-optional
```

### 4. Set Up Database

```bash
# Create uploads directory
mkdir -p apps/api/uploads
chmod 755 apps/api/uploads

# Push database schema
npm run db:push

# (Optional) Seed with demo data
npm run db:seed
```

### 5. Configure Environment Variables

In your hosting control panel, add these environment variables:

```
NODE_ENV=production
PORT=4000
DATABASE_URL=mysql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:3306/omukweyo
WEB_ORIGIN=http://omukweyo.com
UPLOAD_BASE_URL=http://omukweyo.com/uploads
VITE_API_URL=http://omukweyo.com
VITE_WS_URL=http://omukweyo.com
```

### 6. Fix Document Root

In your hosting control panel:
- Change document root from `/httpdocs`
- To: `/httpdocs/apps/web/dist`

### 7. Restart Application

Click the restart button in your hosting control panel.

## ✅ Verification

Test these after deployment:

```bash
# 1. Check if API is running
curl http://omukweyo.com/api/health

# Expected response:
# {"ok":true,"uptime":123,"tickets":0,"notifications":0,"companies":0}

# 2. Check frontend
curl -I http://omukweyo.com/

# Expected: HTTP 200 OK
```

## 🔄 Alternative: Build on Server

If you prefer to build on the Linux server instead of uploading built files:

```bash
# Install ALL dependencies (including dev)
npm install --no-optional

# Build the project
npm run build

# Then install only production dependencies
rm -rf node_modules
npm install --production --no-optional
```

## 🚨 Common Issues After Fix

### Issue: "Cannot find module '@prisma/client'"

**Solution**: Run Prisma generation:
```bash
npm run db:generate
# or
cd apps/api && npx prisma generate
```

### Issue: "Port 4000 already in use"

**Solution**: Your host may assign a different port. Check hosting docs or logs for the assigned port.

### Issue: Database connection fails

**Solution**: 
1. Verify DATABASE_URL is correct
2. Check MySQL is accessible from your server
3. Ensure database `omukweyo` exists
4. Test connection:
```bash
mysql -h HOST -u USER -p omukweyo
```

## 📝 What Was Changed

In `package.json`, I moved the Windows-specific package:

**Before:**
```json
"devDependencies": {
  "@esbuild/win32-x64": "^0.28.1",
  "concurrently": "^9.0.1"
}
```

**After:**
```json
"devDependencies": {
  "concurrently": "^9.0.1"
},
"optionalDependencies": {
  "@esbuild/win32-x64": "^0.28.1"
}
```

This allows npm to skip it on non-Windows systems when using `--no-optional`.

## 🎯 Quick Reference

**The ONE Command You Need:**
```bash
npm install --production --no-optional
```

Use this instead of:
- ❌ `npm install`
- ❌ `npm install --production`
- ✅ `npm install --production --no-optional`

---

**Need more help?** Check:
- `DEPLOY_CHECKLIST.md` - Step-by-step deployment
- `DEPLOYMENT.md` - Full deployment guide
- `SETUP.md` - Development setup
