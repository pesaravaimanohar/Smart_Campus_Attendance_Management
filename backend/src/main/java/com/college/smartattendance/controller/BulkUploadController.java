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
@CrossOrigin(origins = "*")
public class BulkUploadController {

    @Autowired
    private BulkUploadService bulkUploadService;

    /**
     * Step 1: Validate student upload and get preview
     */
    @PostMapping("/students/validate")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_BULK_UPLOAD)
    public ResponseEntity<BulkUploadValidationResult> validateStudentUpload(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws IOException {

        Long userId = getUserId(authentication);
        BulkUploadValidationResult result = bulkUploadService.validateStudentUpload(file, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * Step 2: Confirm student upload
     */
    @PostMapping("/students/confirm/{uploadLogId}")
    @RequiresPermission(PermissionMatrix.Permission.STUDENT_BULK_UPLOAD)
    public ResponseEntity<Integer> confirmStudentUpload(
            @PathVariable Long uploadLogId,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        int count = bulkUploadService.confirmStudentUpload(uploadLogId, userId);
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

    // Helper method
    private Long getUserId(Authentication authentication) {
        // TODO: Extract user ID from authentication
        return 1L; // Placeholder
    }
}
