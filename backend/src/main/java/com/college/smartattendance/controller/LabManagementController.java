package com.college.smartattendance.controller;

import com.college.smartattendance.config.PermissionMatrix;
import com.college.smartattendance.config.RequiresPermission;
import com.college.smartattendance.entity.*;
import com.college.smartattendance.service.LabAssignmentService;
import com.college.smartattendance.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for managing labs and lab faculty assignments
 */
@RestController
@RequestMapping("/api/admin/data/labs")
public class LabManagementController {

    @Autowired
    private LabAssignmentService labAssignmentService;

    @Autowired
    private SubjectRepository subjectRepository;

    /**
     * Create a new lab subject
     */
    @PostMapping("/create")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_CREATE)
    public ResponseEntity<Subject> createLab(
            @RequestParam String labName,
            @RequestParam String labCode,
            Authentication authentication) {
        try {
            Subject lab = new Subject();
            lab.setName(labName);
            lab.setCode(labCode);
            lab.setSubjectType(SubjectType.LAB);

            Subject savedLab = subjectRepository.save(lab);
            return ResponseEntity.ok(savedLab);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create lab: " + e.getMessage());
        }
    }

    /**
     * Get all labs
     */
    @GetMapping("/list")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_READ)
    public ResponseEntity<List<Subject>> getAllLabs() {
        List<Subject> labs = subjectRepository.findBySubjectType(SubjectType.LAB);
        return ResponseEntity.ok(labs);
    }

    /**
     * Get all active lab assignments
     */
    @GetMapping("/assignments/active")
    // @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_READ)
    public ResponseEntity<List<Map<String, Object>>> getAllActiveAssignments() {
        try {
            List<LabFacultyAssignment> assignments = labAssignmentService.getAllActiveAssignments();
            List<Map<String, Object>> result = new ArrayList<>();
            
            if (assignments.isEmpty()) {
                // Return a dummy to test UI
                Map<String, Object> dummy = new HashMap<>();
                dummy.put("id", -1L);
                Map<String, Object> lab = new HashMap<>();
                lab.put("id", -1L); lab.put("name", "DEBUG: No Labs Found"); lab.put("code", "DEBUG");
                dummy.put("labSubject", lab);
                Map<String, Object> cc = new HashMap<>();
                cc.put("id", -1L); cc.put("name", "DEBUG CLASS");
                dummy.put("courseClass", cc);
                Map<String, Object> fac = new HashMap<>();
                fac.put("id", -1L); fac.put("firstName", "DEBUG"); fac.put("lastName", "FACULTY"); fac.put("facultyId", "DEBUG");
                dummy.put("faculty", fac);
                result.add(dummy);
            }

            for (LabFacultyAssignment a : assignments) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getId());
                
                try {
                    if (a.getLabSubject() != null) {
                        Map<String, Object> lab = new HashMap<>();
                        lab.put("id", a.getLabSubject().getId());
                        lab.put("name", a.getLabSubject().getName());
                        lab.put("code", a.getLabSubject().getCode());
                        map.put("labSubject", lab);
                    }
                } catch (Exception e) { /* ignore */ }
                
                try {
                    if (a.getFaculty() != null && a.getFaculty().getUser() != null) {
                        Map<String, Object> faculty = new HashMap<>();
                        faculty.put("id", a.getFaculty().getId());
                        faculty.put("firstName", a.getFaculty().getUser().getFirstName());
                        faculty.put("lastName", a.getFaculty().getUser().getLastName());
                        faculty.put("facultyId", a.getFaculty().getFacultyId());
                        map.put("faculty", faculty);
                    }
                } catch (Exception e) { 
                    Map<String, Object> faculty = new HashMap<>();
                    faculty.put("id", -1L);
                    faculty.put("firstName", "Unknown");
                    faculty.put("lastName", "Faculty");
                    faculty.put("facultyId", "ERR");
                    map.put("faculty", faculty);
                }
                
                try {
                    if (a.getCourseClass() != null) {
                        Map<String, Object> cc = new HashMap<>();
                        cc.put("id", a.getCourseClass().getId());
                        cc.put("name", a.getCourseClass().getName());
                        map.put("courseClass", cc);
                    }
                } catch (Exception e) { /* ignore */ }
                
                // Always add the map, even if incomplete
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Throwable e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getClass().getName() + ": " + e.getMessage());
            List<Map<String, Object>> errorList = new ArrayList<>();
            errorList.add(error);
            return ResponseEntity.ok(errorList); // Return as 200 to see error in UI
        }
    }

    /**
     * Assign faculty to a lab (up to 3 faculty)
     */
    @PostMapping("/{labId}/faculty")
    // @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_CREATE)
    public ResponseEntity<Map<String, Object>> assignFacultyToLab(
            @PathVariable Long labId,
            @RequestParam String facultyIds,
            @RequestParam Long classId,
            @RequestParam Long academicYearId,
            Authentication authentication) {
        try {
            Long userId = getUserId(authentication);

            // Parse faculty IDs from comma-separated string
            List<Long> ids = java.util.Arrays.stream(facultyIds.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::valueOf)
                    .toList();

            // Validate exactly 3 faculty
            if (ids.size() != 3) {
                throw new RuntimeException("Exactly 3 faculty must be assigned to a lab");
            }

            List<LabFacultyAssignment> assignments = labAssignmentService.assignFacultyToLab(
                    labId, ids, classId, academicYearId, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Faculty assigned successfully");
            response.put("count", assignments.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        }
    }

/*
    @GetMapping("/debug/all")
    public ResponseEntity<List<LabFacultyAssignment>> debugAll() {
        return ResponseEntity.ok(labAssignmentService.getAllActiveAssignments());
    }
*/

    /**
     * Get faculty assigned to a lab
     */
    @GetMapping("/{labId}/faculty")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_READ)
    public ResponseEntity<List<LabFacultyAssignment>> getLabFaculty(
            @PathVariable Long labId,
            @RequestParam Long classId) {
        List<LabFacultyAssignment> assignments = labAssignmentService.getLabFaculty(labId, classId);
        return ResponseEntity.ok(assignments);
    }

    /**
     * Replace a faculty in lab assignment
     */
    @PutMapping("/assignment/{assignmentId}/faculty/{newFacultyId}")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_UPDATE)
    public ResponseEntity<LabFacultyAssignment> updateLabFaculty(
            @PathVariable Long assignmentId,
            @PathVariable Long newFacultyId,
            Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            LabFacultyAssignment updated = labAssignmentService.updateLabFaculty(assignmentId, newFacultyId, userId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update faculty: " + e.getMessage());
        }
    }

    /**
     * Remove faculty from lab
     */
    @DeleteMapping("/assignment/{assignmentId}")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_DELETE)
    public ResponseEntity<Void> removeFacultyFromLab(
            @PathVariable Long assignmentId,
            Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            labAssignmentService.removeFacultyFromLab(assignmentId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to remove faculty: " + e.getMessage());
        }
    }

    /**
     * Get labs a faculty is assigned to
     */
    @GetMapping("/faculty/{facultyId}/my-labs")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_READ)
    public ResponseEntity<List<LabFacultyAssignment>> getFacultyLabs(
            @PathVariable Long facultyId) {
        List<LabFacultyAssignment> labs = labAssignmentService.getFacultyActiveLabs(facultyId);
        return ResponseEntity.ok(labs);
    }

    /**
     * Check if faculty is assigned to a lab
     */
    @GetMapping("/verify/{labId}/faculty/{facultyId}")
    @RequiresPermission(PermissionMatrix.Permission.ASSIGNMENT_READ)
    public ResponseEntity<Map<String, Object>> verifyFacultyAssignment(
            @PathVariable Long labId,
            @PathVariable Long facultyId,
            @RequestParam Long classId) {
        boolean isAssigned = labAssignmentService.isFacultyAssignedToLab(facultyId, labId, classId);

        Map<String, Object> response = new HashMap<>();
        response.put("labId", labId);
        response.put("facultyId", facultyId);
        response.put("classId", classId);
        response.put("isAssigned", isAssigned);

        return ResponseEntity.ok(response);
    }

    // Helper method
    private Long getUserId(Authentication authentication) {
        // TODO: Extract user ID from authentication
        return 1L; // Placeholder
    }
}
