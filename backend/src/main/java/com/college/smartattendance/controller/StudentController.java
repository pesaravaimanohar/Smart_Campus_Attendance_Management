package com.college.smartattendance.controller;

import com.college.smartattendance.dto.QrAttendanceRequest;
import com.college.smartattendance.entity.AttendanceRecord;
import com.college.smartattendance.entity.Student;
import com.college.smartattendance.entity.User;
import com.college.smartattendance.repository.StudentRepository;
import com.college.smartattendance.repository.UserRepository;
import com.college.smartattendance.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    private Student getAuthenticatedStudent(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        return studentRepository.findByUser(user).orElseThrow(() -> new RuntimeException("Student profile not found"));
    }

    @PostMapping("/mark-attendance")
    public ResponseEntity<AttendanceRecord> markAttendance(
            Authentication authentication,
            @RequestParam("sessionId") Long sessionId,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam(value = "file", required = false) MultipartFile file) {

        Student student = getAuthenticatedStudent(authentication);

        // Save file logic here or simply pass placeholder path
        String imagePath = "attendance_captures/" + student.getId() + "_" + sessionId + ".jpg";

        // Actual file saving logic to disk would go here

        return ResponseEntity.ok(attendanceService.markAttendance(
                student.getId(),
                sessionId,
                latitude,
                longitude,
                imagePath));
    }

    @PostMapping("/qr-attendance")
    public ResponseEntity<?> markQrAttendance(
            Authentication authentication,
            @RequestBody QrAttendanceRequest request) {
        try {
            Student student = getAuthenticatedStudent(authentication);
            AttendanceRecord record = attendanceService.validateAndMarkByQr(
                    student.getId(),
                    request.getQrToken(),
                    request.getLatitude(),
                    request.getLongitude()
            );

            String statusMessage;
            switch (record.getStatus()) {
                case PRESENT:
                    statusMessage = "Attendance marked successfully!";
                    break;
                case REJECTED:
                    statusMessage = "Attendance rejected: " + record.getRemarks();
                    break;
                default:
                    statusMessage = "Attendance recorded with status: " + record.getStatus();
            }

            return ResponseEntity.ok(Map.of(
                    "status", record.getStatus().toString(),
                    "message", statusMessage,
                    "timestamp", record.getTimestamp().toString(),
                    "subjectName", record.getSession().getFacultySubjectMap().getSubject().getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/session-info")
    public ResponseEntity<?> getSessionInfo(
            @RequestParam("qrToken") String qrToken) {
        try {
            return ResponseEntity.ok(attendanceService.getSessionInfoByQrToken(qrToken));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/analytics")
    public ResponseEntity<com.college.smartattendance.dto.StudentAnalyticsDto> getAnalytics(
            Authentication authentication) {
        Student student = getAuthenticatedStudent(authentication);
        return ResponseEntity.ok(attendanceService.getStudentAnalytics(student.getId()));
    }

    @GetMapping("/subjects")
    public ResponseEntity<?> getStudentSubjects(Authentication authentication) {
        Student student = getAuthenticatedStudent(authentication);
        return ResponseEntity.ok(attendanceService.getStudentSubjects(student.getId()));
    }

    @GetMapping("/subject-attendance/{subjectId}")
    public ResponseEntity<com.college.smartattendance.dto.SubjectAttendanceDto> getSubjectAttendance(
            Authentication authentication,
            @PathVariable Long subjectId) {
        Student student = getAuthenticatedStudent(authentication);
        return ResponseEntity.ok(attendanceService.getSubjectAttendance(student.getId(), subjectId));
    }

    @GetMapping("/attendance-status")
    public ResponseEntity<com.college.smartattendance.dto.AttendanceStatusDto> getAttendanceStatus(
            Authentication authentication) {
        Student student = getAuthenticatedStudent(authentication);
        return ResponseEntity.ok(attendanceService.getAttendanceStatus(student.getId()));
    }

    @GetMapping("/today-sessions")
    public ResponseEntity<List<com.college.smartattendance.dto.TodaySessionDto>> getTodaySessions(
            Authentication authentication) {
        Student student = getAuthenticatedStudent(authentication);
        return ResponseEntity.ok(attendanceService.getTodaySessions(student.getId()));
    }

    @GetMapping("/attendance-history")
    public ResponseEntity<List<com.college.smartattendance.dto.AttendanceHistoryDto>> getAttendanceHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "5") int limit) {
        Student student = getAuthenticatedStudent(authentication);
        return ResponseEntity.ok(attendanceService.getAttendanceHistory(student.getId(), limit));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<String>> getAlerts(Authentication authentication) {
        Student student = getAuthenticatedStudent(authentication);
        return ResponseEntity.ok(attendanceService.getStudentAlerts(student.getId()));
    }
}

