# 🚀 EduVault Production Deployment Guide

## Production URLs

### Backend (Render)
- **URL**: https://eduvault-exms.onrender.com
- **Status**: ✅ Deployed

### Frontend (Netlify)
- **Student Portal**: https://eduvault-student.netlify.app
- **Admin Portal**: https://eduvault-admin.netlify.app
- **Super Admin Portal**: https://eduvault-superadmin.netlify.app

---

## ✅ Production Configuration Completed

### 1. Server Configuration (`server/.env`)
```env
NODE_ENV=production
BACKEND_URL=https://eduvault-exms.onrender.com
FRONTEND_URL=https://eduvault-student.netlify.app
MPESA_CALLBACK_URL=https://eduvault-exms.onrender.com/api/payments/mpesa/callback
```

### 2. Frontend Configuration
All three frontends updated:
- `student-frontend/.env`
- `admin-frontend/.env`
- `super-admin-frontend/.env`

```env
REACT_APP_BACKEND_URL=https://eduvault-exms.onrender.com
```

### 3. Smart URL Resolution
The `api.js` file automatically:
- Uses production URL when deployed
- Falls back to localhost when developing locally
- No code changes needed for local development

---

## 📦 Git Repository Setup

### Files Protected by .gitignore
- ✅ `.env` files (sensitive credentials)
- ✅ `node_modules/` (dependencies)
- ✅ `build/` directories (generated files)
- ✅ Log files
- ✅ OS-specific files
- ✅ IDE configuration

### Important Notes
⚠️ **NEVER commit `.env` files to public repositories!**
- They contain sensitive API keys and credentials
- Use environment variables on hosting platforms instead

---

## 🔐 Environment Variables for Render

When deploying to Render, set these environment variables in the dashboard:

```
MONGODB_URI=mongodb+srv://eduvault:honeywellT55$@cluster0.udsslk9.mongodb.net/eduvault?retryWrites=true&w=majority&appName=Cluster0&ssl=true&tlsAllowInvalidCertificates=true

JWT_SECRET=eduvault_super_secret_jwt_key_for_development_2024
JWT_EXPIRE=7d

NODE_ENV=production
PORT=5001
FRONTEND_URL=https://eduvault-student.netlify.app
BACKEND_URL=https://eduvault-exms.onrender.com

MPESA_CONSUMER_KEY=4CNyZAAlMSslZzGGA9QME5XlXpcviHbSC7uTD5Z3mgIrqUOl
MPESA_CONSUMER_SECRET=ecaJR4OMDZlrAoqG6WmQgZG5gvr4gS20w6qrfGZyAYadjp5IevUcO5OGOAuw8pdE
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://eduvault-exms.onrender.com/api/payments/mpesa/callback

CLOUDINARY_CLOUD_NAME=dmatqsg8a
CLOUDINARY_API_KEY=741113318755745
CLOUDINARY_API_SECRET=tqVVCItXUeuM6GMu2TXi_RlACd8

GROK_API_KEY=your_grok_api_key
GROK_API_URL=https://api.x.ai/v1

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🌐 Environment Variables for Netlify

For each frontend (Student, Admin, Super Admin):

```
REACT_APP_BACKEND_URL=https://eduvault-exms.onrender.com
REACT_APP_NAME=EduVault Student Portal
REACT_APP_VERSION=1.0.0
REACT_APP_SECURE_MODE=true
GENERATE_SOURCEMAP=false
```

---

## 🔄 Deployment Workflow

### Backend (Render)
1. Push code to GitHub
2. Render automatically detects changes
3. Builds and deploys server
4. Available at: https://eduvault-exms.onrender.com

### Frontend (Netlify)
1. Push code to GitHub
2. Netlify automatically detects changes
3. Builds React apps
4. Deploys to respective URLs

---

## 🧪 Testing Production Setup

### 1. Test Backend
```bash
curl https://eduvault-exms.onrender.com/api/health
```

### 2. Test Frontend Connection
- Visit: https://eduvault-student.netlify.app
- Check browser console for API calls
- Verify they're hitting: https://eduvault-exms.onrender.com

### 3. Test Features
- ✅ User registration/login
- ✅ Course browsing
- ✅ Resource downloads
- ✅ M-Pesa payments
- ✅ File uploads

---

## 🐛 Troubleshooting

### CORS Issues
If you see CORS errors, verify in `server/server.js`:
```javascript
app.use(cors({
  origin: [
    'https://eduvault-student.netlify.app',
    'https://eduvault-admin.netlify.app',
    'https://eduvault-superadmin.netlify.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

### API Not Connecting
1. Check Render logs for errors
2. Verify environment variables are set
3. Check MongoDB connection
4. Verify frontend `.env` has correct backend URL

### Build Failures
1. Check Node.js version compatibility
2. Verify all dependencies are in `package.json`
3. Check build logs on Render/Netlify
4. Ensure no syntax errors

---

## 📊 Monitoring

### Render Dashboard
- Monitor server health
- Check logs
- View metrics
- Manage environment variables

### Netlify Dashboard
- Monitor deployments
- Check build logs
- View analytics
- Manage domains

---

## 🔒 Security Checklist

- ✅ Environment variables not in git
- ✅ HTTPS enabled on all URLs
- ✅ JWT tokens for authentication
- ✅ CORS properly configured
- ✅ API rate limiting enabled
- ✅ Input validation on all endpoints
- ✅ Secure file uploads (Cloudinary)
- ✅ M-Pesa webhook secured

---

## 📝 Git Commands Used

```bash
# Stage all changes
git add .

# Commit with message
git commit -m "Configure production environment with Render backend URL"

# Push to GitHub
git push origin main
```

---

## 🎉 Production Ready!

Your EduVault application is now configured for production:
- ✅ Backend deployed on Render
- ✅ Frontends ready for Netlify
- ✅ Environment variables configured
- ✅ Security measures in place
- ✅ Monitoring enabled

**Next Steps:**
1. Push code to GitHub
2. Verify Render deployment
3. Verify Netlify deployments
4. Test all features in production
5. Monitor logs for any issues

---

## 📞 Support

If you encounter issues:
1. Check Render logs: https://dashboard.render.com
2. Check Netlify logs: https://app.netlify.com
3. Review this deployment guide
4. Check MongoDB Atlas for database issues

**Good luck with your deployment! 🚀**
