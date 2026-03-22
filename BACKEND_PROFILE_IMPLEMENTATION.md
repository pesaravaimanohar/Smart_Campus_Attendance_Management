# Backend Implementation - Profile Picture Upload System

## ✅ What Was Implemented

### 1. **User Entity Update** (`entity/User.java`)
- ✅ Added `profileImage` field (String) to store image URL
- ✅ Added getter and setter methods

### 2. **File Storage Service** (`service/FileStorageService.java`)
**Features:**
- ✅ Validates file type (JPG, PNG, WEBP only)
- ✅ Validates file size (max 2MB)
- ✅ Generates unique filenames (userId_UUID.extension)
- ✅ Stores files in `uploads/profiles` directory
- ✅ Returns public URL for accessing files
- ✅ Deletes old files when new ones are uploaded
- ✅ Proper error handling

**Key Methods:**
```java
String storeFile(MultipartFile file, String userId)
void deleteFile(String fileUrl)
```

### 3. **File Controller** (`controller/FileController.java`)
**Endpoint:**
- `GET /api/files/{filename}` - Serves uploaded images

**Features:**
- ✅ Public access (no authentication required)
- ✅ Proper content-type headers (image/jpeg, image/png, image/webp)
- ✅ Inline display (not download)
- ✅ Error handling for missing files

### 4. **User Profile Controller** (`controller/UserProfileController.java`)
**Endpoints:**

#### GET /api/me
Returns current user profile:
```json
{
  "id": 1,
  "username": "student123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "STUDENT",
  "profileImage": "http://localhost:8080/api/files/1_uuid.jpg",
  "contactNumber": "1234567890",
  "gender": "Male",
  "dob": "2000-01-01"
}
```

#### PUT /api/me/profile-image
Upload profile picture:
- **Content-Type**: `multipart/form-data`
- **Field Name**: `file`
- **Validation**: JPG/PNG/WEBP, max 2MB
- **Response**: Success message + new profileImage URL

#### DELETE /api/me/profile-image
Remove profile picture:
- Deletes file from storage
- Sets profileImage to null
- Returns success message

#### PUT /api/me
Update profile info:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "contactNumber": "1234567890"
}
```

### 5. **Security Configuration** (`config/SecurityConfig.java`)
Updated to:
- ✅ Permit public access to `/api/files/**` (serve images)
- ✅ Require authentication for `/api/me/**` (profile management)
- ✅ Allow all authenticated users to access profile endpoints

### 6. **Application Configuration** (`application.properties`)
Added:
```properties
file.upload-dir=uploads/profiles
```

## 📁 File Structure Created

```
backend/
├── src/main/java/com/college/smartattendance/
│   ├── entity/
│   │   └── User.java (UPDATED - added profileImage field)
│   ├── service/
│   │   └── FileStorageService.java (NEW)
│   ├── controller/
│   │   ├── FileController.java (NEW - serve files)
│   │   └── UserProfileController.java (NEW - profile management)
│   └── config/
│       └── SecurityConfig.java (UPDATED - security rules)
├── src/main/resources/
│   └── application.properties (UPDATED - file upload config)
└── uploads/
    └── profiles/ (AUTO-CREATED - stores uploaded images)
```

## 🔒 Security Features

1. **Authentication Required**: All profile endpoints require valid JWT
2. **User Isolation**: Users can only access their own profile
3. **File Validation**: 
   - File type checked (JPG/PNG/WEBP only)
   - File size limited (2MB max)
4. **Unique Filenames**: Prevents filename collision
5. **Old File Cleanup**: Previous profile pictures are deleted

## 📊 Data Flow

### Upload Flow
```
Frontend                    Backend
   │                          │
   ├─ Select file             │
   ├─ Validate (2MB, type)    │
   ├─ POST to /api/me/        │
   │  profile-image           │
   │                          ├─ Authenticate user
   │                          ├─ Validate file
   │                          ├─ Delete old image
   │                          ├─ Save new file
   │                          ├─ Update database
   │                          └─ Return URL
   │                          │
   ├─ Reload page             │
   └─ Display new image       │
```

### Display Flow
```
Frontend                    Backend
   │                          │
   ├─ GET /api/me             │
   │                          ├─ Authenticate
   │                          └─ Return user + profileImage URL
   │                          │
   ├─ GET /api/files/{file}   │
   │                          ├─ Find file
   │                          └─ Stream image
   │                          │
   └─ Display image           │
```

## 🧪 Testing the Endpoints

### 1. Get Current User
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/me
```

### 2. Upload Profile Picture
```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "file=@/path/to/image.jpg" \
     http://localhost:8080/api/me/profile-image
```

### 3. Remove Profile Picture
```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8080/api/me/profile-image
```

### 4. Access Uploaded File
```bash
curl http://localhost:8080/api/files/1_uuid-here.jpg
```

## ⚠️ Important Notes

### Database Migration
When you restart the Spring Boot application:
- Hibernate will automatically add the `profile_image` column to the `users` table
- Existing users will have `NULL` values (which is fine - frontend shows initials)

### File Storage
- Files are stored in: `uploads/profiles/` (relative to project root)
- Format: `{userId}_{UUID}.{extension}`
- Example: `1_a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg`

### CORS Configuration
- Already configured to allow `http://localhost:5173`
- Supports multipart uploads

## 🔄 What Happens Now

1. **Backend Restart**: Spring Boot should auto-restart (you're using dev mode)
2. **Database Update**: `profile_image` column added to `users` table
3. **Directory Creation**: `uploads/profiles/` folder created automatically
4. **Endpoints Ready**: All 4 endpoints are now available

## ✅ Testing Checklist

Once backend restarts:
- [ ] Login to frontend
- [ ] Click profile avatar
- [ ] Select "Update Profile Picture"
- [ ] Upload a JPG/PNG/WEBP image (< 2MB)
- [ ] ✅ Should succeed and show success message
- [ ] Refresh page
- [ ] ✅ Should see your uploaded image in avatar
- [ ] Click avatar again
- [ ] Remove profile picture
- [ ] ✅ Should show initials again

## 🐛 Troubleshooting

### "Failed to upload profile picture"
- Check backend logs for specific error
- Verify file is JPG/PNG/WEBP
- Verify file is under 2MB
- Check JWT token is valid

### Image not displaying
- Check `uploads/profiles/` folder exists
- Verify file was saved
- Check URL in database matches actual file
- Try accessing URL directly: `http://localhost:8080/api/files/{filename}`

### "User not found"
- JWT token might be invalid
- Try logging out and logging in again

## 📝 Database Schema Update

```sql
-- This will be automatically executed by Hibernate
ALTER TABLE users ADD COLUMN profile_image VARCHAR(255);
```

## 🎉 Integration Complete

Frontend ↔️ Backend integration is now complete!

- Frontend has UserProfileMenu component ✅
- Backend has all 4 profile endpoints ✅
- File storage configured ✅
- Security configured ✅
- CORS enabled ✅

**You can now upload, display, and remove profile pictures!** 🚀
