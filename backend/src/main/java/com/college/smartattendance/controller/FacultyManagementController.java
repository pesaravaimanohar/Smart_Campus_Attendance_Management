package com.college.smartattendance.controller;

import com.college.smartattendance.config.PermissionMatrix;
import com.college.smartattendance.config.RequiresPermission;
import com.college.smartattendance.dto.FacultyDto;
import com.college.smartattendance.entity.EmploymentStatus;
import com.college.smartattendance.entity.Role;
import com.college.smartattendance.service.FacultyManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for faculty management
 */
@RestController
@RequestMapping("/api/faculty")
@CrossOrigin(origins = "*")
public class FacultyManagementController {

    @Autowired
    private FacultyManagementService facultyManagementService;

    @GetMapping
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_READ)
    public ResponseEntity<List<FacultyDto>> getAllFaculty() {
        return ResponseEntity.ok(facultyManagementService.getAllFaculty());
    }

    @GetMapping("/{id}")
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_READ)
    public ResponseEntity<FacultyDto> getFacultyById(@PathVariable Long id) {
        return ResponseEntity.ok(facultyManagementService.getFacultyById(id));
    }

    @GetMapping("/faculty-id/{facultyId}")
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_READ)
    public ResponseEntity<FacultyDto> getByFacultyId(@PathVariable String facultyId) {
        return ResponseEntity.ok(facultyManagementService.getFacultyByFacultyId(facultyId));
    }

    @GetMapping("/department/{departmentCode}")
    @RequiresPermission(value = PermissionMatrix.Permission.FACULTY_READ, checkDepartment = true)
    public ResponseEntity<List<FacultyDto>> getByDepartment(@PathVariable String departmentCode) {
        return ResponseEntity.ok(facultyManagementService.getFacultyByDepartment(departmentCode));
    }

    @GetMapping("/status/{status}")
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_READ)
    public ResponseEntity<List<FacultyDto>> getByStatus(@PathVariable EmploymentStatus status) {
        return ResponseEntity.ok(facultyManagementService.getFacultyByStatus(status));
    }

    @GetMapping("/role/{role}")
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_READ)
    public ResponseEntity<List<FacultyDto>> getByRole(@PathVariable Role role) {
        return ResponseEntity.ok(facultyManagementService.getFacultyByRole(role));
    }

    @PostMapping
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_CREATE)
    public ResponseEntity<FacultyDto> createFaculty(
            @RequestBody FacultyDto dto,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(facultyManagementService.createFaculty(dto, userId));
    }

    @PutMapping("/{id}")
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_UPDATE)
    public ResponseEntity<FacultyDto> updateFaculty(
            @PathVariable Long id,
            @RequestBody FacultyDto dto,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(facultyManagementService.updateFaculty(id, dto, userId));
    }

    @PatchMapping("/{id}/status")
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_UPDATE)
    public ResponseEntity<Void> updateStatus(
            @PathVariable Long id,
            @RequestParam EmploymentStatus status,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        facultyManagementService.updateFacultyStatus(id, status, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_DELETE)
    public ResponseEntity<Void> deleteFaculty(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        facultyManagementService.deleteFaculty(id, userId);
        return ResponseEntity.ok().build();
    }

    // Helper method
    private Long getUserId(Authentication authentication) {
        // TODO: Extract user ID from authentication
        return 1L; // Placeholder
    }
}
