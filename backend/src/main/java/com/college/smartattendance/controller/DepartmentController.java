package com.college.smartattendance.controller;

import com.college.smartattendance.config.PermissionMatrix;
import com.college.smartattendance.config.RequiresPermission;
import com.college.smartattendance.dto.DepartmentDto;
import com.college.smartattendance.entity.Program;
import com.college.smartattendance.entity.ProgramType;
import com.college.smartattendance.service.DepartmentManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for department and program management
 */
@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentManagementService departmentManagementService;

    // ==================== DEPARTMENT ENDPOINTS ====================

    @GetMapping
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_READ)
    public ResponseEntity<List<DepartmentDto>> getAllDepartments() {
        return ResponseEntity.ok(departmentManagementService.getAllDepartments());
    }

    @GetMapping("/active")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_READ)
    public ResponseEntity<List<DepartmentDto>> getActiveDepartments() {
        return ResponseEntity.ok(departmentManagementService.getActiveDepartments());
    }

    @GetMapping("/{id}")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_READ)
    public ResponseEntity<DepartmentDto> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentManagementService.getDepartmentById(id));
    }

    @GetMapping("/code/{code}")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_READ)
    public ResponseEntity<DepartmentDto> getDepartmentByCode(@PathVariable String code) {
        return ResponseEntity.ok(departmentManagementService.getDepartmentByCode(code));
    }

    @PostMapping
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_CREATE)
    public ResponseEntity<DepartmentDto> createDepartment(
            @RequestBody DepartmentDto dto,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(departmentManagementService.createDepartment(dto, userId));
    }

    @PutMapping("/{id}")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_UPDATE)
    public ResponseEntity<DepartmentDto> updateDepartment(
            @PathVariable Long id,
            @RequestBody DepartmentDto dto,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(departmentManagementService.updateDepartment(id, dto, userId));
    }

    @PatchMapping("/{id}/status")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_UPDATE)
    public ResponseEntity<Void> setDepartmentStatus(
            @PathVariable Long id,
            @RequestParam boolean active,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        departmentManagementService.setDepartmentStatus(id, active, userId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{departmentId}/hod/{facultyId}")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_SET_HOD)
    public ResponseEntity<Void> setHOD(
            @PathVariable Long departmentId,
            @PathVariable Long facultyId,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        departmentManagementService.setHOD(departmentId, facultyId, userId);
        return ResponseEntity.ok().build();
    }

    // ==================== PROGRAM ENDPOINTS ====================

    @GetMapping("/{departmentId}/programs")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_READ)
    public ResponseEntity<List<Program>> getProgramsByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(departmentManagementService.getProgramsByDepartment(departmentId));
    }

    @GetMapping("/programs")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_READ)
    public ResponseEntity<List<Program>> getAllPrograms() {
        return ResponseEntity.ok(departmentManagementService.getAllPrograms());
    }

    @GetMapping("/programs/active")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_READ)
    public ResponseEntity<List<Program>> getActivePrograms() {
        return ResponseEntity.ok(departmentManagementService.getActivePrograms());
    }

    @PostMapping("/{departmentId}/programs")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_CREATE)
    public ResponseEntity<Program> createProgram(
            @PathVariable Long departmentId,
            @RequestParam String code,
            @RequestParam String name,
            @RequestParam ProgramType type,
            @RequestParam Integer duration,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        Program program = departmentManagementService.createProgram(
                departmentId, code, name, type, duration, userId);
        return ResponseEntity.ok(program);
    }

    @PatchMapping("/programs/{programId}/status")
    @RequiresPermission(PermissionMatrix.Permission.DEPARTMENT_UPDATE)
    public ResponseEntity<Void> setProgramStatus(
            @PathVariable Long programId,
            @RequestParam boolean active,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        departmentManagementService.setProgramStatus(programId, active, userId);
        return ResponseEntity.ok().build();
    }

    // Helper method
    private Long getUserId(Authentication authentication) {
        // TODO: Extract user ID from authentication
        return 1L; // Placeholder
    }
}
