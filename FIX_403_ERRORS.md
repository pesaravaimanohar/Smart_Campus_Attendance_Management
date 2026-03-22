# 🔧 Quick Fix: 403 Forbidden Errors

## Problem
After backend restart, all API endpoints are returning **403 Forbidden** errors.

## Root Cause
When the Spring Boot backend restarts, the JWT tokens issued before the restart become invalid (if the secret changed or the user session expired).

## ✅ Solution: Log Out and Log Back In

### Step 1: Clear Your Session
1. Open browser (http://localhost:5173)
2. Press **F12** to open Developer Tools
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Find **Local Storage** → `http://localhost:5173`
5. **Delete** the `token` key
6. Close Developer Tools

### Step 2: Refresh and Login
1. **Refresh** the page (F5)
2. You should now see the **Login Page**
3. **Login** with your credentials:
   - Username: `student123` (or your username)
   - Password: `password@123` (or your password)
4. After successful login, you'll be redirected to the dashboard

### Step 3: Test Profile Upload
1. Click your **profile avatar** (top-right)
2. Select **"Update Profile Picture"**
3. Choose an image (JPG, PNG, or WEBP, under 2MB)
4. Click **"Upload New Photo"**
5. ✅ **Should work now!**

## Alternative: Quick Logout Method

If there's a logout button visible:
1. Click **Logout**
2. Login again
3. Try the profile upload

## Verify Backend is Running

Open a new terminal and run:
```bash
curl http://localhost:8080/api/auth/test
```

If you get a 404 or any response (not connection refused), the backend is running.

## What Changed in the Backend

The backend now has these new features:
- ✅ `GET /api/me` - Get your profile
- ✅ `PUT /api/me/profile-image` - Upload profile picture
- ✅ `DELETE /api/me/profile-image` - Remove profile picture  
- ✅ `GET /api/files/{filename}` - View uploaded images

## Database Changes

The backend automatically added a new column:
```sql
ALTER TABLE users ADD COLUMN profile_image VARCHAR(255);
```

All existing users have `NULL` values (which is fine - the frontend shows initials).

## Next Steps

After logging in again:
1. All API calls should work (no more 403 errors)
2. Profile picture upload will work
3. Your image will be saved in `backend/uploads/profiles/`
4. The image URL will be stored in the database
5. Refresh the page to see your uploaded picture everywhere!

---

**TL;DR**: The 403 errors are because your JWT token expired when the backend restarted. Just **logout and login again** and everything will work! 🚀
