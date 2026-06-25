# 🚀 Omukweyo Deployment Checklist

## Based on Your Hosting Control Panel Screenshot

### ✅ Already Configured
- [x] Node.js Version: 24.18.0
- [x] Package Manager: npm
- [x] Application Mode: production
- [x] Application URL: http://omukweyo.com
- [x] Application Startup File: app.js (created ✅)

### ⚠️ CRITICAL - Must Fix

#### 1. Document Root (SECURITY ISSUE!)
**Current**: `/httpdocs` ⚠️ **UNSAFE - Exposes source code!**

**Action Required**: Change to `/httpdocs/apps/web/dist`

This ensures only your built frontend files are served, not your source code or environment files.

#### 2. Environment Variables
**Current**: `[specify]` - Not configured

**Action Required**: Click `[specify]` and add these variables:

```
NODE_ENV=production
PORT=4000
DATABASE_URL=mysql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:3306/omukweyo
WEB_ORIGIN=http://omukweyo.com
UPLOAD_BASE_URL=http://omukweyo.com/uploads
VITE_API_URL=http://omukweyo.com
VITE_WS_URL=http://omukweyo.com
```

**Important**: Replace database credentials with your actual values!

### 📋 Pre-Deployment Steps

#### On Your Local Machine
- [x] 1. Build completed (`npm run build` - DONE ✅)
- [ ] 2. Test build locally: `npm run start:api`
- [ ] 3. Verify all files are ready to upload

#### Upload to Server
- [ ] 4. Upload all files to `/httpdocs/` via FTP/SFTP
- [ ] 5. Ensure these folders are uploaded:
  - `apps/api/dist/` (compiled API)
  - `apps/web/dist/` (built frontend)
  - `apps/api/prisma/` (database schema)
  - `packages/shared/dist/` (compiled types)
  - `node_modules/` (or install on server)
  - `app.js` (✅ created)
  - `package.json`
  - `package-lock.json`

#### On Production Server (SSH or Control Panel)

##### Install Dependencies
```bash
cd /httpdocs
npm install --production
```

##### Database Setup
```bash
# Push schema to create tables
npm run db:push

# Optional: Seed with demo data
npm run db:seed
```

##### Create Uploads Directory
```bash
mkdir -p apps/api/uploads
chmod 755 apps/api/uploads
```

#### In Control Panel

- [ ] 6. **Change Document Root** to `/httpdocs/apps/web/dist`
- [ ] 7. **Configure Environment Variables** (see above)
- [ ] 8. **Verify Startup File** is set to `app.js`
- [ ] 9. **Click "Restart Application"**

### ✓ Post-Deployment Verification

Test these endpoints after deployment:

```bash
# 1. API Health Check
curl http://omukweyo.com/api/health

# Expected: {"ok":true,"uptime":123,"tickets":0,"notifications":0,"companies":0}

# 2. Frontend Homepage
Open in browser: http://omukweyo.com/

# 3. Check API endpoints work
curl http://omukweyo.com/api/businesses

# 4. WebSocket Connection
Open browser console at http://omukweyo.com/ and check for Socket.IO connection
```

### 🐛 If Something Goes Wrong

#### Application Won't Start
1. Check application logs in control panel
2. Verify `app.js` exists
3. Run `npm install` on server
4. Check Node.js version is 24.18.0

#### Database Connection Errors
1. Verify `DATABASE_URL` in environment variables
2. Test MySQL connection from server
3. Ensure database `omukweyo` exists
4. Check user has correct permissions

#### 404 Errors on Frontend
1. Verify Document Root is set to `/httpdocs/apps/web/dist`
2. Check that `apps/web/dist/index.html` exists
3. Verify build completed successfully

#### API Routes Not Working
1. Application must be running on assigned port
2. Check hosting proxy/forwarding configuration
3. Verify environment variables are set

### 📞 Quick Reference

**API Port**: 4000 (or hosting-assigned)  
**Document Root**: `/httpdocs/apps/web/dist`  
**Startup File**: `app.js`  
**Node Version**: 24.18.0  
**Package Manager**: npm  

### 🎯 Success Criteria

Your deployment is successful when:
- ✅ Homepage loads at http://omukweyo.com/
- ✅ API health check responds: `/api/health`
- ✅ Business directory loads: `/businesses`
- ✅ No source code visible in browser
- ✅ WebSocket connects (check browser console)
- ✅ Can create test ticket through UI

---

**Need help?** Check `DEPLOYMENT.md` for detailed troubleshooting.
