package com.college.smartattendance.controller;

import com.college.smartattendance.entity.Faculty;
import com.college.smartattendance.service.FacultyService;
import com.college.smartattendance.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/faculty")
public class FacultyController {

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private AttendanceService attendanceService;

    @PreAuthorize("hasRole('FACULTY')")
    @PostMapping("/sessions")
    public ResponseEntity<com.college.smartattendance.entity.AttendanceSession> createSession(
            @RequestBody Map<String, Object> payload) {
        Long mapId = Long.parseLong(payload.get("mapId").toString());
        Double lat = Double.parseDouble(payload.get("latitude").toString());
        Double lon = Double.parseDouble(payload.get("longitude").toString());
        Integer duration = Integer.parseInt(payload.get("duration").toString());
        Double radius = payload.containsKey("radius") ? Double.parseDouble(payload.get("radius").toString()) : 50.0;

        return ResponseEntity.ok(attendanceService.createSession(mapId, lat, lon, duration, radius));
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
