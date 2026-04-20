package com.college.smartattendance.controller;

import com.college.smartattendance.config.PermissionMatrix;
import com.college.smartattendance.config.RequiresPermission;
import com.college.smartattendance.dto.StudentDto;
import com.college.smartattendance.entity.StudentStatus;
import com.college.smartattendance.service.StudentManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for student management
 */
@RestController
@RequestMapping("/api/students")
public class StudentManagementController {

    @Autowired
    private StudentManagementService studentManagementService;

    @GetMapping
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_READ)
    public ResponseEntity<List<StudentDto>> getAllStudents() {
        return ResponseEntity.ok(studentManagementService.getAllStudents());
    }

    @GetMapping("/{id}")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_READ)
    public ResponseEntity<StudentDto> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(studentManagementService.getStudentById(id));
    }

    @GetMapping("/roll/{rollNumber}")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_READ)
    public ResponseEntity<StudentDto> getStudentByRollNumber(@PathVariable String rollNumber) {
        return ResponseEntity.ok(studentManagementService.getStudentByRollNumber(rollNumber));
    }

    @GetMapping("/department/{departmentCode}")
    @RequiresPermission(value = PermissionMatrix.Permission.STUDENT_READ, checkDepartment = true)
    public ResponseEntity<List<StudentDto>> getStudentsByDepartment(@PathVariable String departmentCode) {
        return ResponseEntity.ok(studentManagementService.getStudentsByDepartment(departmentCode));
    }

    @GetMapping("/semester/{semester}")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_READ)
    public ResponseEntity<List<StudentDto>> getStudentsBySemester(@PathVariable Integer semester) {
        return ResponseEntity.ok(studentManagementService.getStudentsBySemester(semester));
    }

    @GetMapping("/status/{status}")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_READ)
    public ResponseEntity<List<StudentDto>> getStudentsByStatus(@PathVariable StudentStatus status) {
        return ResponseEntity.ok(studentManagementService.getStudentsByStatus(status));
    }

    @GetMapping("/department/{departmentCode}/semester/{semester}")
    @RequiresPermission(value = PermissionMatrix.Permission.STUDENT_READ, checkDepartment = true)
    public ResponseEntity<List<StudentDto>> getStudentsByDepartmentAndSemester(
            @PathVariable String departmentCode,
            @PathVariable Integer semester) {
        return ResponseEntity.ok(studentManagementService.getStudentsByDepartmentAndSemester(departmentCode, semester));
    }

    @PostMapping
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_CREATE)
    public ResponseEntity<StudentDto> createStudent(
            @RequestBody StudentDto dto,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(studentManagementService.createStudent(dto, userId));
    }

    @PutMapping("/{id}")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_UPDATE)
    public ResponseEntity<StudentDto> updateStudent(
            @PathVariable Long id,
            @RequestBody StudentDto dto,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(studentManagementService.updateStudent(id, dto, userId));
    }

    @PatchMapping("/{id}/status")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_UPDATE)
    public ResponseEntity<Void> updateStudentStatus(
            @PathVariable Long id,
            @RequestParam StudentStatus status,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        studentManagementService.updateStudentStatus(id, status, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_DELETE)
    public ResponseEntity<Void> deleteStudent(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        studentManagementService.deleteStudent(id, userId);
        return ResponseEntity.ok().build();
    }

    // Helper method
    private Long getUserId(Authentication authentication) {
        // TODO: Extract user ID from authentication
        return 1L; // Placeholder
    }
}
