package com.college.smartattendance.controller;

import com.college.smartattendance.config.PermissionMatrix;
import com.college.smartattendance.config.RequiresPermission;
import com.college.smartattendance.entity.*;
import com.college.smartattendance.service.SubjectAssignmentService;
import com.college.smartattendance.service.SubjectEligibilityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for subject eligibility and assignment management
 */
@RestController
@RequestMapping("/api/subjects")
public class SubjectManagementController {

    @Autowired
    private SubjectEligibilityService eligibilityService;

    @Autowired
    private SubjectAssignmentService assignmentService;

    // ==================== ELIGIBILITY ENDPOINTS ====================

    /**
     * Add subject eligibility for a faculty
     */
    @PostMapping("/eligibility")
    @RequiresPermission(PermissionMatrix.Permission.ELIGIBILITY_MANAGE)
    public ResponseEntity<FacultySubjectEligibility> addEligibility(
            @RequestParam Long facultyId,
            @RequestParam Long subjectId,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        FacultySubjectEligibility eligibility = eligibilityService.addEligibility(facultyId, subjectId, userId);
        return ResponseEntity.ok(eligibility);
    }

    /**
     * Remove subject eligibility
     */
    @DeleteMapping("/eligibility/{eligibilityId}")
    @RequiresPermission(PermissionMatrix.Permission.ELIGIBILITY_MANAGE)
    public ResponseEntity<Void> removeEligibility(
            @PathVariable Long eligibilityId,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        eligibilityService.removeEligibility(eligibilityId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Get eligible subjects for a faculty
     */
    @GetMapping("/eligibility/faculty/{facultyId}/subjects")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_READ)
    public ResponseEntity<List<Subject>> getEligibleSubjects(@PathVariable Long facultyId) {
        return ResponseEntity.ok(eligibilityService.getEligibleSubjects(facultyId));
    }

    /**
     * Get eligible faculty for a subject
     */
    @GetMapping("/eligibility/subject/{subjectId}/faculty")
    @RequiresPermission(PermissionMatrix.Permission.ELIGIBILITY_MANAGE)
    public ResponseEntity<List<Faculty>> getEligibleFaculty(@PathVariable Long subjectId) {
        return ResponseEntity.ok(eligibilityService.getEligibleFaculty(subjectId));
    }

    /**
     * Bulk add eligibilities
     */
    @PostMapping("/eligibility/bulk")
    @RequiresPermission(PermissionMatrix.Permission.ELIGIBILITY_MANAGE)
    public ResponseEntity<Integer> bulkAddEligibilities(
            @RequestParam Long facultyId,
            @RequestBody List<Long> subjectIds,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        int count = eligibilityService.bulkAddEligibilities(facultyId, subjectIds, userId);
        return ResponseEntity.ok(count);
    }

    // ==================== ASSIGNMENT ENDPOINTS ====================

    /**
     * Assign a subject to faculty
     */
    @PostMapping("/assignments")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_CREATE)
    public ResponseEntity<FacultySubjectMap> assignSubject(
            @RequestParam Long facultyId,
            @RequestParam Long subjectId,
            @RequestParam String section,
            @RequestParam(required = false) String academicYear,
            @RequestParam(required = false) Integer semester,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        FacultySubjectMap assignment = assignmentService.assignSubject(
                facultyId, subjectId, section, academicYear, semester, userId);
        return ResponseEntity.ok(assignment);
    }

    /**
     * Unassign a subject
     */
    @DeleteMapping("/assignments/{assignmentId}")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_DELETE)
    public ResponseEntity<Void> unassignSubject(
            @PathVariable Long assignmentId,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        assignmentService.unassignSubject(assignmentId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Lock an assignment
     */
    @PatchMapping("/assignments/{assignmentId}/lock")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_LOCK)
    public ResponseEntity<Void> lockAssignment(
            @PathVariable Long assignmentId,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        assignmentService.lockAssignment(assignmentId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Unlock an assignment
     */
    @PatchMapping("/assignments/{assignmentId}/unlock")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_UNLOCK)
    public ResponseEntity<Void> unlockAssignment(
            @PathVariable Long assignmentId,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        assignmentService.unlockAssignment(assignmentId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Get faculty assignments
     */
    @GetMapping("/assignments/faculty/{facultyId}")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_READ)
    public ResponseEntity<List<FacultySubjectMap>> getFacultyAssignments(@PathVariable Long facultyId) {
        return ResponseEntity.ok(assignmentService.getFacultyAssignments(facultyId));
    }

    /**
     * Get subject assignments
     */
    @GetMapping("/assignments/subject/{subjectId}")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_READ)
    public ResponseEntity<List<FacultySubjectMap>> getSubjectAssignments(@PathVariable Long subjectId) {
        return ResponseEntity.ok(assignmentService.getSubjectAssignments(subjectId));
    }

    /**
     * Get faculty workload
     */
    @GetMapping("/assignments/faculty/{facultyId}/workload")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_READ)
    public ResponseEntity<Integer> getFacultyWorkload(@PathVariable Long facultyId) {
        return ResponseEntity.ok(assignmentService.getFacultyWorkload(facultyId));
    }

    /**
     * Reassign a subject
     */
    @PatchMapping("/assignments/{assignmentId}/reassign")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_UPDATE)
    public ResponseEntity<FacultySubjectMap> reassignSubject(
            @PathVariable Long assignmentId,
            @RequestParam Long newFacultyId,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        FacultySubjectMap assignment = assignmentService.reassignSubject(assignmentId, newFacultyId, userId);
        return ResponseEntity.ok(assignment);
    }

    // Helper method
    private Long getUserId(Authentication authentication) {
        // TODO: Extract user ID from authentication
        return 1L; // Placeholder
    }
}
