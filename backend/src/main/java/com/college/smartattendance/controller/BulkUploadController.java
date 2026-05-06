package com.college.smartattendance.controller;

import com.college.smartattendance.config.PermissionMatrix;
import com.college.smartattendance.config.RequiresPermission;
import com.college.smartattendance.dto.BulkUploadValidationResult;
import com.college.smartattendance.service.BulkUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * REST Controller for bulk upload operations
 * Thin controller - all business logic in service layer
 */
@RestController
@RequestMapping("/api/bulk-upload")
public class BulkUploadController {

    @Autowired
    private BulkUploadService bulkUploadService;

    @Autowired
    private com.college.smartattendance.repository.UserRepository userRepository;

    /**
     * Step 1: Validate student upload and get preview
     */
    @PostMapping("/students/validate")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_BULK_UPLOAD)
    public ResponseEntity<BulkUploadValidationResult> validateStudentUpload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "targetClassId", required = false) Long targetClassId,
            Authentication authentication) throws IOException {

        Long userId = getUserId(authentication);
        BulkUploadValidationResult result = bulkUploadService.validateStudentUpload(file, userId, targetClassId);
        return ResponseEntity.ok(result);
    }

    /**
     * Step 2: Confirm student upload
     */
    @PostMapping("/students/confirm/{uploadLogId}")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_BULK_UPLOAD)
    public ResponseEntity<Integer> confirmStudentUpload(
            @PathVariable Long uploadLogId,
            @RequestParam(value = "targetClassId", required = false) Long targetClassId,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        int count = bulkUploadService.confirmStudentUpload(uploadLogId, userId, targetClassId);
        return ResponseEntity.ok(count);
    }

    /**
     * Step 1: Validate faculty upload and get preview
     */
    @PostMapping("/faculty/validate")
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_BULK_UPLOAD)
    public ResponseEntity<BulkUploadValidationResult> validateFacultyUpload(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        Long userId = getUserId(authentication);
        BulkUploadValidationResult result = bulkUploadService.validateFacultyUpload(file, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * Step 2: Confirm faculty upload
     */
    @PostMapping("/faculty/confirm/{uploadLogId}")
    @RequiresPermission(PermissionMatrix.Permission.FACULTY_BULK_UPLOAD)
    public ResponseEntity<Integer> confirmFacultyUpload(
            @PathVariable Long uploadLogId,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        int count = bulkUploadService.confirmFacultyUpload(uploadLogId, userId);
        return ResponseEntity.ok(count);
    }

    /**
     * Step 1: Validate attendance upload
     */
    @PostMapping("/attendance/validate")
    @RequiresPermission(PermissionMatrix.Permission.ATTENDANCE_BULK_UPLOAD)
    public ResponseEntity<BulkUploadValidationResult> validateAttendanceUpload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("mappingId") Long mappingId,
            @RequestParam("date") String date,
            Authentication authentication) throws IOException {

        Long userId = getUserId(authentication);
        BulkUploadValidationResult result = bulkUploadService.validateAttendanceUpload(file, userId, mappingId, date);
        return ResponseEntity.ok(result);
    }

    /**
     * Step 2: Confirm attendance upload
     */
    @PostMapping("/attendance/confirm/{uploadLogId}")
    @RequiresPermission(PermissionMatrix.Permission.ATTENDANCE_BULK_UPLOAD)
    public ResponseEntity<Integer> confirmAttendanceUpload(
            @PathVariable Long uploadLogId,
            @RequestParam("mappingId") Long mappingId,
            @RequestParam("date") String date,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        int count = bulkUploadService.confirmAttendanceUpload(uploadLogId, userId, mappingId, date);
        return ResponseEntity.ok(count);
    }

    /**
     * Step 1: Validate monthly attendance upload (matrix format: rows=students, columns=dates)
     */
    @PostMapping("/attendance/monthly/validate")
    @RequiresPermission(PermissionMatrix.Permission.ATTENDANCE_BULK_UPLOAD)
    public ResponseEntity<?> validateMonthlyAttendanceUpload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("mappingId") Long mappingId,
            Authentication authentication) throws IOException {

        Long userId = getUserId(authentication);
        var result = bulkUploadService.validateMonthlyAttendanceUpload(file, userId, mappingId);
        return ResponseEntity.ok(result);
    }

    /**
     * Step 2: Confirm monthly attendance upload
     */
    @PostMapping("/attendance/monthly/confirm/{uploadLogId}")
    @RequiresPermission(PermissionMatrix.Permission.ATTENDANCE_BULK_UPLOAD)
    public ResponseEntity<Integer> confirmMonthlyAttendanceUpload(
            @PathVariable Long uploadLogId,
            @RequestParam("mappingId") Long mappingId,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        int count = bulkUploadService.confirmMonthlyAttendanceUpload(uploadLogId, userId, mappingId);
        return ResponseEntity.ok(count);
    }

    private Long getUserId(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) return 1L;
        
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(user -> user.getId())
                .orElse(1L);
    }
}
