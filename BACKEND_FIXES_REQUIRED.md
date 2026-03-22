# Backend Startup Issues - Fix Summary

## Issues Found (2026-02-10)

### ✅ FIXED: Database Schema Error
**Problem**: `row_number` is a MySQL reserved keyword causing SQL syntax error
**Solution**: Renamed column to `row_num` in `TempUploadData` entity
**Status**: ✅ COMPLETED

### ❌ CRITICAL: FacultyManagementService Compilation Errors

The `FacultyManagementService` has multiple compilation errors. This service was created during Phase 4 development but has missing dependencies.

**Required Fixes:**

#### 1. Missing Repository Methods in `FacultyRepository`:
```java
// Add these methods to FacultyRepository.java:
Optional<Faculty> findByFacultyId(String facultyId);
List<Faculty> findByDepartment(String department);
List<Faculty> findByEmploymentStatus(EmploymentStatus status);
Optional<Faculty> findByUserId(Long userId);
```

#### 2. Missing Repository Methods in `UserRepository`:
```java
//Add this method to UserRepository.java:
List<User> findByRole(Role role);
```

#### 3. Missing Fields in `FacultyDto`:
```java
// Add these fields to FacultyDto.java:
private String mobile;
private LocalDate dob;
private Role role;

// Add getters/setters:
public String getMobile() { return mobile; }
public void setMobile(String mobile) { this.mobile = mobile; }

public LocalDate getDob() { return dob; }
public void setDob(LocalDate dob) { this.dob = dob; }

public Role getRole() { return role; }
public void setRole(Role role) { this.role = role; }
```

#### 4. Fix `joiningDate` Type Mismatch in `FacultyDto`:
```java
// Change from String to LocalDate
private LocalDate joiningDate;

public LocalDate getJoiningDate() { return joiningDate; }
public void setJoiningDate(LocalDate joiningDate) { this.joiningDate = joiningDate; }
```

#### 5. Add `INACTIVE` to `EmploymentStatus` Enum:
```java
// In EmploymentStatus.java enum:
public enum EmploymentStatus {
    ACTIVE,
    INACTIVE,  // ADD THIS
    ON_LEAVE,
    RETIRED
}
```

### Quick Workaround (Temporary):

**Option 1 - Comment Out FacultyManagementService (Quickest)**
- Comment out `FacultyManagementService.java`
- Comment out `FacultyManagementController.java`  
- This allows the app to start while you work on the fixes

**Option 2 - Fix All Issues**
- Add all missing methods to repositories
- Add all missing fields to DTOs
- Fix enum values
- This provides full functionality

## Recommendation:

Since the frontend is ready and working perfectly, I recommend **Option 1** to get the backend running quickly. The Faculty Management module can be completed later as it's part of the new management system we're building.

The core attendance system (Student/Faculty dashboards, QR scanning, etc.) will work fine without this new service.

## Files to Fix (for Option 2):

1. `backend/src/main/java/com/college/smartattendance/repository/FacultyRepository.java`
2. `backend/src/main/java/com/college/smartattendance/repository/UserRepository.java`
3. `backend/src/main/java/com/college/smartattendance/dto/FacultyDto.java`
4. `backend/src/main/java/com/college/smartattendance/entity/EmploymentStatus.java`

## Status:
- ✅ Frontend: Running successfully on port 5174
- ❌ Backend: Failing to start due to FacultyManagementService errors
- ✅ Database connection: Working
- ✅ Schema issue: Fixed (row_num)
