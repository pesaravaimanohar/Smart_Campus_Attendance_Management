package com.college.smartattendance.controller;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.service.FacultyService;
import com.college.smartattendance.service.AttendanceService;
import com.college.smartattendance.repository.FacultySubjectMapRepository;
import com.college.smartattendance.repository.AttendanceRecordRepository;
import com.college.smartattendance.repository.AttendanceSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/faculty")
public class FacultyController {

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private FacultySubjectMapRepository facultySubjectMapRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;

    // ── Get faculty's assigned class-subject mappings ────────────────────────
    @PreAuthorize("hasRole('FACULTY')")
    @GetMapping("/mappings")
    public ResponseEntity<?> getFacultyMappings(Principal principal) {
        try {
            Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
            List<FacultySubjectMap> maps = facultySubjectMapRepository.findByFaculty_Id(faculty.getId());

            List<Map<String, Object>> result = maps.stream().map(m -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", m.getId());
                item.put("subjectName", m.getSubject().getName());
                item.put("subjectCode", m.getSubject().getCode());
                item.put("className", m.getCourseClass().getName());
                item.put("classId", m.getCourseClass().getId());
                item.put("section", m.getSection());
                item.put("academicYear", m.getAcademicYear() != null ? m.getAcademicYear().getName() : null);
                return item;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('FACULTY')")
    @PostMapping("/sessions")
    public ResponseEntity<AttendanceSession> createSession(
            @RequestBody Map<String, Object> payload) {
        Long mapId = Long.parseLong(payload.get("mapId").toString());
        Double lat = Double.parseDouble(payload.get("latitude").toString());
        Double lon = Double.parseDouble(payload.get("longitude").toString());
        Integer duration = Integer.parseInt(payload.get("duration").toString());
        Double radius = payload.containsKey("radius") ? Double.parseDouble(payload.get("radius").toString()) : 50.0;

        return ResponseEntity.ok(attendanceService.createSession(mapId, lat, lon, duration, radius));
    }

    @PreAuthorize("hasRole('FACULTY')")
    @PostMapping("/sessions/{sessionId}/refresh-qr")
    public ResponseEntity<?> refreshQrToken(@PathVariable Long sessionId) {
        try {
            AttendanceSession session = attendanceService.refreshQrToken(sessionId);
            return ResponseEntity.ok(Map.of(
                    "qrToken", session.getQrToken(),
                    "sessionId", session.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('FACULTY')")
    @PostMapping("/sessions/{sessionId}/end")
    public ResponseEntity<?> endSession(@PathVariable Long sessionId) {
        try {
            attendanceService.endSession(sessionId);
            return ResponseEntity.ok(Map.of("message", "Session ended successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('FACULTY')")
    @GetMapping("/sessions/{sessionId}/count")
    public ResponseEntity<?> getSessionAttendanceCount(@PathVariable Long sessionId) {
        try {
            int count = attendanceService.getSessionAttendanceCount(sessionId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Get detailed attendance records for a session (for post-session review) ─
    @PreAuthorize("hasRole('FACULTY')")
    @GetMapping("/sessions/{sessionId}/attendance")
    public ResponseEntity<?> getSessionAttendance(@PathVariable Long sessionId) {
        try {
            AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found"));

            List<AttendanceRecord> records = attendanceRecordRepository.findBySession(session);

            List<Map<String, Object>> result = records.stream().map(r -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("recordId", r.getId());
                item.put("studentId", r.getStudent().getId());
                item.put("rollNumber", r.getStudent().getUser() != null ? r.getStudent().getUser().getUsername() : "");
                item.put("studentName",
                        (r.getStudent().getUser() != null ?
                                ((r.getStudent().getUser().getFirstName() != null ? r.getStudent().getUser().getFirstName() : "") +
                                 " " +
                                 (r.getStudent().getUser().getLastName() != null ? r.getStudent().getUser().getLastName() : "")).trim()
                                : "Unknown"));
                item.put("status", r.getStatus().name());
                item.put("remarks", r.getRemarks());
                item.put("timestamp", r.getTimestamp());
                return item;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ── Update individual attendance record status (for faculty review) ──────
    @PreAuthorize("hasRole('FACULTY')")
    @PatchMapping("/attendance/{recordId}/status")
    public ResponseEntity<?> updateAttendanceStatus(
            @PathVariable Long recordId,
            @RequestBody Map<String, String> payload) {
        try {
            AttendanceRecord record = attendanceRecordRepository.findById(recordId)
                    .orElseThrow(() -> new RuntimeException("Record not found"));

            String newStatus = payload.get("status");
            record.setStatus(AttendanceStatus.valueOf(newStatus));
            if (payload.containsKey("remarks")) {
                record.setRemarks(payload.get("remarks"));
            }
            attendanceRecordRepository.save(record);
            return ResponseEntity.ok(Map.of("message", "Status updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('FACULTY', 'HOD')")
    @PostMapping("/manual-attendance")
    public ResponseEntity<?> markManualAttendance(@RequestBody Map<String, Object> payload, Principal principal) {
        try {
            String username = principal.getName();
            Faculty faculty = facultyService.getFacultyByUsername(username);

            Long sessionId = Long.parseLong(payload.get("sessionId").toString());
            String studentRollNo = payload.get("studentRollNo").toString();
            String reason = payload.get("reason").toString();

            facultyService.markManualAttendance(faculty.getId(), sessionId, studentRollNo, reason);
            return ResponseEntity.ok(Map.of("message", "Attendance marked manually"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

