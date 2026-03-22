# Visual Design Specifications - User Profile & Identity System

## 🎨 Component Layouts

### 1. UserProfileMenu - Initial State (Avatar Only)

```
┌─────────────────────────────────────────────────┐
│  Dashboard              🔔 [MP]                 │  ← Header (64px height)
└─────────────────────────────────────────────────┘
                             ↑
                             Avatar (36-40px)
                             - Circular
                             - Profile image or initials
                             - 2px white border
                             - Hover: scale(1.05) + shadow
```

**Avatar States:**
- **With Photo**: Displays uploaded profile picture
- **Without Photo**: Shows initials on primary color background
- **Hover**: Subtle scale up (105%) + increased shadow

### 2. UserProfileMenu - Dropdown Open

```
┌─────────────────────────────────────────────────┐
│  Dashboard              🔔 [MP] ←────┐          │
└────────────────────────────────────┐ │          │
                                     │ │          │
                         ┌───────────▼─▼──────────┐
                         │  ┌──┐  Manohar P.      │
                         │  │MP│  Student • MCA   │ ← Header (48px avatar)
                         │  └──┘  21MH1A0501      │
                         ├────────────────────────┤
                         │  📷  Update Picture    │
                         ├────────────────────────┤
                         │  🚪  Logout            │
                         └────────────────────────┘
                                  ↑
                          240px wide, borderRadius: 2
```

**Menu Structure:**
1. **Header Section** (gray background)
   - Large avatar (48px)
   - Full name (bold)
   - Role chip (color-coded)
   - Department info
   - Username/ID

2. **Actions Section**
   - Update Profile Picture
   - Logout (red text)

### 3. Upload Dialog

```
┌───────────────────────────────────────────┐
│  Update Profile Picture                   │ ← Title bar
├───────────────────────────────────────────┤
│                                           │
│              ┌──────┐                     │
│              │      │                     │
│              │  MP  │  ← 120px avatar     │
│              │      │                     │
│              └──────┘                     │
│                                           │
│  [Upload New Photo] ← Primary button     │
│  [Remove Photo]     ← Outlined button    │
│                                           │
│  JPG, PNG, or WEBP • Max 2MB             │ ← Help text
│                                           │
└───────────────────────────────────────────┘
```

### 4. GreetingWidget (Student Dashboard Only)

```
┌─────────────────────────────────────────────────────────┐
│  Good morning, Manohar 👋                               │ ← h5, bold
│  Here's a quick look at your attendance and today's... │ ← body2, secondary
└─────────────────────────────────────────────────────────┘
     ↑
  Light indigo background (#6366f1 @ 3% opacity)
  Border: 1px solid divider
  borderRadius: 2
  Padding: 3 (24px)
```

## 🎨 Color Specifications

### Role Badge Colors

| Role | Chip Color | Background | Text |
|------|-----------|------------|------|
| Student | Primary | #EEF2FF | #6366F1 |
| Faculty | Secondary | #F3E8FF | #9333EA |
| HOD | Warning | #FEF3C7 | #D97706 |
| Admin | Error | #FEE2E2 | #DC2626 |
| Super Admin | Error | #FEE2E2 | #DC2626 |

### Avatar Fallback Colors
- **Background**: `primary.main` (#6366F1)
- **Text**: White (#FFFFFF)
- **Font Size**: Based on avatar size
  - 36px avatar → ~16px font
  - 48px avatar → ~20px font
  - 120px avatar → ~48px font

## 📐 Spacing & Sizing

### Avatar Sizes by Context
```
┌─────────────────┬────────────┬───────────┐
│ Context         │ Size (px)  │ Initials  │
├─────────────────┼────────────┼───────────┤
│ Header (compact)│ 36         │ 16px      │
│ Header (normal) │ 40         │ 18px      │
│ Sidebar         │ 48         │ 20px      │
│ Menu header     │ 48         │ 20px      │
│ Profile dialog  │ 120        │ 48px      │
└─────────────────┴────────────┴───────────┘
```

### Spacing System
```
Greeting Widget:
  - Padding: 24px (theme.spacing(3))
  - Margin bottom: 24px
  - Border radius: 8px (theme.shape.borderRadius * 2)

Profile Menu:
  - Min width: 240px
  - Padding (header): 16px
  - Padding (menu items): 12px vertical, 16px horizontal
  - Border radius: 8px
  - Elevation: 3

Upload Dialog:
  - Max width: xs (444px)
  - Padding: 24px
  - Avatar margin bottom: 24px
  - Button spacing: 8px
```

## 🎭 Animation Specifications

### Avatar Hover Effect
```css
transition: all 0.2s ease-in-out;
&:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

### Menu Open Animation
- **Transform Origin**: `{ horizontal: 'right', vertical: 'top' }`
- **Anchor Origin**: `{ horizontal: 'right', vertical: 'bottom' }`
- **Transition**: Material-UI default (Grow + Fade)

### Upload Progress
- Uses Material-UI CircularProgress
- Size: 24px
- Color: inherit (white on primary button)

## 📱 Responsive Behavior

### Desktop (> 960px)
```
┌─────────────┬──────────────────────────────────┐
│             │  Dashboard            🔔 [MP]    │
│  Sidebar    │                                   │
│             │  GreetingWidget                   │
│  Dashboard  │  ┌──────────────────────────┐    │
│  Classes    │  │ Attendance Overview      │    │
│  History    │  └──────────────────────────┘    │
│  Profile    │                                   │
│             │                                   │
│  [Logout]   │                                   │
└─────────────┴──────────────────────────────────┘
   240px wide          Flexible
```

### Mobile (< 960px)
```
┌──────────────────────────────────┐
│ ☰  Dashboard            🔔 [MP]  │ ← Hamburger + Avatar
├──────────────────────────────────┤
│  GreetingWidget                  │
│  ┌────────────────────────────┐  │
│  │ Attendance Overview        │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘

Drawer Sidebar (slide in from left):
┌─────────────┐
│  JNTUA CE   │
│             │
│  Dashboard  │ ← Full width when open
│  Classes    │
│  History    │
│  Profile    │
│             │
│  [Logout]   │
└─────────────┘
  280px wide
```

## 🖼️ Profile Picture Specifications

### Accepted Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WEBP (.webp)

### Size Constraints
- **Maximum File Size**: 2MB (2,097,152 bytes)
- **Recommended Dimensions**: 400x400px
- **Aspect Ratio**: 1:1 (square)

### Processing (Backend Should Do)
1. Validate file type
2. Validate file size
3. Resize to 400x400px (if larger)
4. Compress (target: < 200KB)
5. Convert to progressive JPEG or optimized PNG
6. Store in CDN/cloud storage
7. Return public URL

### Display Behavior
- Always rendered in circular container
- Uses CSS `object-fit: cover`
- Handles various aspect ratios gracefully
- Falls back to initials if:
  - URL is null/undefined
  - Image fails to load
  - Network error

## 🎯 Interactive States

### Avatar States
```
├─ Default
│  ├─ With Image: Shows photo
│  └─ Without Image: Shows initials on colored background
│
├─ Hover
│  ├─ Transform: scale(1.05)
│  ├─ Shadow: increased
│  └─ Cursor: pointer
│
├─ Active (clicked)
│  └─ Opens dropdown menu
│
└─ Loading (during upload)
   └─ Shows CircularProgress overlay
```

### Menu States
```
├─ Closed (default)
│
├─ Open
│  ├─ Shows user info
│  ├─ Shows action items
│  └─ Auto-closes on click outside
│
└─ Item Hover
   └─ Background: action.hover
```

### Upload Dialog States
```
├─ Idle
│  ├─ Shows current photo or initials
│  ├─ Upload button enabled
│  └─ Remove button (only if photo exists)
│
├─ Selecting File
│  └─ Native file picker open
│
├─ Uploading
│  ├─ Upload button shows CircularProgress
│  ├─ All buttons disabled
│  └─ Shows "Uploading..." text
│
├─ Success
│  ├─ Shows success message
│  └─ Auto-reloads page after 500ms
│
└─ Error
   ├─ Shows error Alert
   └─ Buttons re-enabled
```

## 📋 Accessibility Features

### Keyboard Navigation
- **Tab**: Navigate to avatar button
- **Enter/Space**: Open dropdown menu
- **Arrow Keys**: Navigate menu items
- **Escape**: Close menu
- **Tab (in menu)**: Cycle through items

### ARIA Attributes
```jsx
<IconButton
  aria-controls="profile-menu"
  aria-haspopup="true"
  aria-expanded={open ? 'true' : 'false'}
>
  <Avatar alt="User Name" />
</IconButton>
```

### Screen Reader Support
- Alt text on images
- Semantic HTML structure
- Proper labeling on buttons
- Status announcements for upload progress

## 🎨 Typography

### User Name Display
- **Font Weight**: 700 (Bold)
- **Variant**: subtitle1 (menu), h5 (greeting)
- **Line Height**: 1.2
- **No Wrap**: Ellipsis on overflow

### Role Badge
- **Font Size**: 0.7rem (menu), 0.75rem (greeting)
- **Font Weight**: 600
- **Text Transform**: None (as provided)
- **Letter Spacing**: Normal

### Help Text
- **Variant**: caption
- **Color**: text.secondary
- **Font Size**: 0.75rem
- **Opacity**: 0.8

---

**Design System**: Material-UI (MUI) v5
**Theme**: Custom Academic Theme (Indigo primary)
**Iconography**: Material Icons
**Font**: Roboto (MUI default)
