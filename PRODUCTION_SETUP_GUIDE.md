# 🚀 PRODUCTION DEPLOYMENT - SETUP GUIDE

## Problem Summary
Login doesn't work because:
- Frontend (Vercel) doesn't know where the backend is (`NEXT_PUBLIC_API_URL` not set)
- Backend (Render) blocks frontend calls due to missing `CORS_ORIGIN`

---

## ✅ STEP 1: SET FRONTEND ENVIRONMENT VARIABLES ON VERCEL

### Go to Vercel Dashboard:
1. Open https://vercel.com/dashboard
2. Click on **"invoice-quote"** project
3. Click **Settings** → **Environment Variables**

### Add this variable:
```
NEXT_PUBLIC_API_URL = https://invoice-quote.onrender.com
```

### Then:
1. Click **Save**
2. Go to **Deployments** tab
3. Click the three dots on latest deployment
4. Select **Redeploy**

---

## ✅ STEP 2: SET BACKEND ENVIRONMENT VARIABLES ON RENDER

### Go to Render Dashboard:
1. Open https://dashboard.render.com
2. Click on your **invoice-quote-backend** service
3. Click **Environment** tab

### Add these variables:

| Variable Name | Value |
|---|---|
| `CORS_ORIGIN` | `https://invoice-quote.vercel.app` |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `JWT_SECRET` | `<generate-random-string-32-chars>` |
| `JWT_REFRESH_SECRET` | `<generate-random-string-32-chars>` |
| `JWT_EXPIRES_IN` | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `BCRYPT_ROUNDS` | `12` |

### Already set (should be correct):
```
DATABASE_URL=postgresql://invoice_bqty_user:i9kazVS8e4VnD0hIHDBCxPxOoJLRTPgM@dpg-d7nkt667r5hc73atfjag-a/invoice_bqty
FRONTEND_URL=https://invoice-quote.vercel.app
BACKEND_URL=https://invoice-quote.onrender.com
```

### Email Configuration (optional but recommended):
```
EMAIL_FROM=noreply@yourcompany.com
EMAIL_FROM_NAME=InvoiceFlow
BREVO_API_KEY=<your-brevo-key>
```

### Then:
1. Click **Save Changes**
2. Render auto-redeploys (watch the logs)

---

## ✅ STEP 3: TEST LOGIN

### Test the flow:
1. Go to https://invoice-quote.vercel.app
2. Click **Login** 
3. Enter: `test1@emapli.com` / `password`
4. You should:
   - ✅ See dashboard load
   - ✅ See successful redirect
   - ✅ Have authentication token in localStorage

### If still not working:
Check browser console (F12):
- Open **Network** tab
- Try login
- Look for `/api/auth/login` request
- Check the **Response** for errors

---

## 🔑 Generate Random Secrets (for JWT_SECRET and JWT_REFRESH_SECRET)

Use Node.js to generate:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use any random string generator with at least 32 characters.

---

## 📋 VERIFICATION CHECKLIST

After setting all variables and redeploying:

- [ ] Vercel shows `NEXT_PUBLIC_API_URL` in Environment Variables
- [ ] Render shows `CORS_ORIGIN` pointing to `https://invoice-quote.vercel.app`
- [ ] Render backend redeploy completed successfully
- [ ] Vercel frontend redeploy completed successfully
- [ ] Login page loads at https://invoice-quote.vercel.app/login
- [ ] Can type email and password without errors
- [ ] Submit button works (no CORS errors in browser console)
- [ ] Redirects to dashboard after login
- [ ] Can see user profile/business info

---

## 🐛 TROUBLESHOOTING

### Error: "Network Error" on login
→ Check `NEXT_PUBLIC_API_URL` is set on Vercel to `https://invoice-quote.onrender.com`

### Error: "CORS error" in browser console
→ Check `CORS_ORIGIN` is set on Render to `https://invoice-quote.vercel.app` (with https://)

### Error: "Invalid credentials" even with correct password
→ Database is working, user exists. Check if:
   - JWT_SECRET is the same on Render
   - DATABASE_URL is correct and database is accessible

### Backend not starting
→ Check Render logs for TypeScript errors
→ Verify DATABASE_URL is accessible

---

## 📞 QUICK REFERENCE

| Item | Production URL |
|------|---|
| Frontend | https://invoice-quote.vercel.app |
| Backend | https://invoice-quote.onrender.com |
| Backend API | https://invoice-quote.onrender.com/api |
| Database | Render Postgres |

---

## ✨ After Login Works

You can then:
1. Create invoices/quotes
2. Add customers and products  
3. Generate PDFs
4. Send via email/WhatsApp
5. Manage templates and settings

---

**Save this guide!** You'll need it if you ever redeploy or add new environment variables.
