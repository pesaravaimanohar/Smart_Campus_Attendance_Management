# User Profile & Identity System

## Overview
This system provides a unified, reusable identity and profile management solution for all user roles in the attendance management system.

## Components

### 1. UserProfileMenu
**Location:** `src/components/UserProfileMenu.jsx`

A reusable dropdown menu component that displays:
- User profile picture (or initials fallback)
- Full name
- Role badge with color coding
- Department and year level (if applicable)
- Username/ID
- Upload/Remove profile picture options
- Logout functionality

**Usage:**
```jsx
import UserProfileMenu from '../components/UserProfileMenu';

// In your dashboard header
<UserProfileMenu size={36} />
```

**Props:**
- `size` (optional): Avatar size in pixels (default: 40)

**Features:**
- Click avatar to open dropdown menu
- Upload new profile picture (JPG, PNG, WEBP, max 2MB)
- Remove existing profile picture
- Automatic initials generation when no photo
- Role-based color coding
- Smooth hover animations
- Mobile responsive

### 2. GreetingWidget
**Location:** `src/components/GreetingWidget.jsx`

Time-based personalized greeting for students.

**Usage:**
```jsx
import GreetingWidget from '../components/GreetingWidget';

// At the top of dashboard content
<GreetingWidget />
```

**Features:**
- Time-based greeting: "Good morning/afternoon/evening"
- Uses user's first name
- Clean, subtle design
- Only for Student Dashboard

## API Functions

### Location: `src/services/api.js`

#### getUserProfile()
Fetches current user profile information.
```javascript
const profile = await getUserProfile();
// Returns: { id, name, email, role, profileImage, department, etc. }
```

#### updateProfileImage(formData)
Uploads a new profile picture.
```javascript
const formData = new FormData();
formData.append('file', file);
await updateProfileImage(formData);
```

#### removeProfileImage()
Removes the user's profile picture.
```javascript
await removeProfileImage();
```

#### updateUserProfile(profileData)
Updates user profile information.
```javascript
await updateUserProfile({ firstName: 'John', lastName: 'Doe' });
```

## Implementation Guide

### For Any Dashboard (Faculty, HOD, Admin, etc.)

1. **Import the component:**
```jsx
import UserProfileMenu from '../components/UserProfileMenu';
```

2. **Add to header toolbar:**
```jsx
<AppBar position="static">
    <Toolbar>
        <Typography variant="h6">Dashboard</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <UserProfileMenu size={40} />
    </Toolbar>
</AppBar>
```

### For Student Dashboard (Additional)

Also add the greeting widget:
```jsx
import GreetingWidget from '../components/GreetingWidget';

// At the top of main content
<Stack spacing={3}>
    <GreetingWidget />
    {/* Rest of dashboard content */}
</Stack>
```

## Design Specifications

### Avatar Sizing
- **Header**: 36-40px
- **Sidebar**: 48px
- **Profile Dialog**: 120px

### Color Coding (by Role)
- **STUDENT**: Primary (Indigo)
- **FACULTY**: Secondary (Purple)
- **HOD**: Warning (Amber)
- **ADMIN**: Error (Red)
- **SUPER_ADMIN**: Error (Red)

### Fallback Avatar
When no profile picture:
- Displays user initials (max 2 characters)
- Background: primary.main color
- Text: white
- Smooth rounded border

### Hover States
- Subtle scale animation (1.05)
- Box shadow increase
- Transition duration: 0.2s

## Backend Requirements

### Endpoints Expected

#### GET /api/me
Returns current user profile:
```json
{
    "id": 123,
    "firstName": "Manohar",
    "lastName": "Pesaravai",
    "username": "21MH1A0501",
    "email": "student@jntua.ac.in",
    "role": "STUDENT",
    "department": "MCA",
    "yearLevel": 1,
    "profileImage": "https://cdn.example.com/profile/123.jpg",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-02-10T00:00:00Z"
}
```

#### PUT /api/me/profile-image
Upload profile picture (multipart/form-data):
- Field name: `file`
- Accepted formats: JPG, PNG, WEBP
- Max size: 2MB
- Server should resize/compress as needed
- Returns updated user object with new profileImage URL

#### DELETE /api/me/profile-image
Remove profile picture:
- Sets profileImage to null
- Returns updated user object

#### PUT /api/me
Update profile information:
```json
{
    "firstName": "John",
    "lastName": "Doe"
}
```

## Example: Adding to Faculty Dashboard

```jsx
import React, { useState } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Container
} from '@mui/material';
import UserProfileMenu from '../components/UserProfileMenu';
import { useAuth } from '../context/AuthContext';

const FacultyDashboard = () => {
    const { user } = useAuth();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <AppBar position="static" elevation={0}>
                <Toolbar>
                    <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
                        Faculty Dashboard
                    </Typography>
                    <UserProfileMenu size={40} />
                </Toolbar>
            </AppBar>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
                <Container maxWidth="xl">
                    {/* Dashboard content */}
                </Container>
            </Box>
        </Box>
    );
};

export default FacultyDashboard;
```

## Security Considerations

1. **File Validation**: Only accept image files (JPG, PNG, WEBP)
2. **Size Limit**: Enforce 2MB maximum file size
3. **Server-side Processing**: 
   - Validate file type on server
   - Resize images to standard dimensions
   - Compress to reduce storage
   - Scan for malicious content
4. **Authentication**: All endpoints require valid JWT token
5. **Authorization**: Users can only update their own profile

## Testing

### Manual Testing Checklist
- [ ] Upload JPG image
- [ ] Upload PNG image
- [ ] Upload WEBP image
- [ ] Try uploading file > 2MB (should show error)
- [ ] Try uploading non-image file (should show error)
- [ ] Remove profile picture
- [ ] Verify initials display correctly
- [ ] Test on mobile devices
- [ ] Test dropdown menu interactions
- [ ] Test logout functionality
- [ ] Verify all roles display correctly
- [ ] Check hover animations

## Troubleshooting

### Profile picture not uploading
- Check network tab for API errors
- Verify file size is under 2MB
- Ensure file format is JPG, PNG, or WEBP
- Check backend endpoint is configured correctly

### Avatar showing wrong initials
- Check user object has firstName/lastName
- Fallback to name field
- Final fallback to username

### Dropdown menu not opening
- Verify UserProfileMenu is imported correctly
- Check for z-index conflicts
- Ensure Material-UI theme is configured

## Future Enhancements

- [ ] Image cropping tool before upload
- [ ] Multiple image format conversions
- [ ] Profile completion percentage
- [ ] Activity/status indicators
- [ ] Custom avatar backgrounds
- [ ] Profile themes
