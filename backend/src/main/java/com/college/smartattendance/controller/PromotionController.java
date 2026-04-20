package com.college.smartattendance.controller;

import com.college.smartattendance.config.PermissionMatrix;
import com.college.smartattendance.config.RequiresPermission;
import com.college.smartattendance.entity.Student;
import com.college.smartattendance.entity.StudentSemesterHistory;
import com.college.smartattendance.service.PromotionEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for promotion operations
 */
@RestController
@RequestMapping("/api/promotion")
public class PromotionController {

    @Autowired
    private PromotionEngineService promotionEngineService;

    /**
     * Execute bulk promotion for a department and semester
     */
    @PostMapping("/execute")
    @RequiresPermission(value = PermissionMatrix.Permission.PROMOTION_EXECUTE, checkDepartment = true)
    public ResponseEntity<PromotionEngineService.PromotionResult> executePromotion(
            @RequestParam String departmentCode,
            @RequestParam Integer currentSemester,
            @RequestParam String academicYear,
            @RequestBody Map<String, Map<String, Object>> promotionData,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        PromotionEngineService.PromotionResult result = promotionEngineService.bulkPromoteStudents(
                departmentCode, currentSemester, academicYear, promotionData, userId);

        return ResponseEntity.ok(result);
    }

    /**
     * Reverse promotion (Admin/Principal only)
     */
    @PostMapping("/reverse")
    @RequiresPermission(PermissionMatrix.Permission.PROMOTION_REVERSE)
    public ResponseEntity<Integer> reversePromotion(
            @RequestParam String departmentCode,
            @RequestParam Integer semester,
            @RequestParam String academicYear,
            Authentication authentication) {

        Long userId = getUserId(authentication);
        int count = promotionEngineService.reversePromotion(departmentCode, semester, academicYear, userId);

        return ResponseEntity.ok(count);
    }

    /**
     * Get eligible students for promotion
     */
    @GetMapping("/eligible")
    @RequiresPermission(value = PermissionMatrix.Permission.PROMOTION_VIEW, checkDepartment = true)
    public ResponseEntity<List<Student>> getEligibleStudents(
            @RequestParam String departmentCode,
            @RequestParam Integer semester) {

        List<Student> students = promotionEngineService.getPromotionEligibleStudents(departmentCode, semester);
        return ResponseEntity.ok(students);
    }

    /**
     * Get promotion history for a student
     */
    @GetMapping("/history/student/{studentId}")
    @RequiresPermission(PermissionMatrix.Permission.PROMOTION_VIEW)
    public ResponseEntity<List<StudentSemesterHistory>> getStudentHistory(@PathVariable Long studentId) {
        List<StudentSemesterHistory> history = promotionEngineService.getStudentPromotionHistory(studentId);
        return ResponseEntity.ok(history);
    }

    /**
     * Get promotion statistics
     */
    @GetMapping("/statistics")
    @RequiresPermission(value = PermissionMatrix.Permission.PROMOTION_VIEW, checkDepartment = true)
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam String departmentCode,
            @RequestParam String academicYear) {

        Map<String, Object> stats = promotionEngineService.getPromotionStatistics(departmentCode, academicYear);
        return ResponseEntity.ok(stats);
    }

    // Helper method
    private Long getUserId(Authentication authentication) {
        // TODO: Extract user ID from authentication
        return 1L; // Placeholder
    }
}
