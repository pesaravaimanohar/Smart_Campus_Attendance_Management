package com.college.smartattendance.controller;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import com.college.smartattendance.service.FacultyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    @Autowired
    private FacultyRepository facultyRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;
    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;
    @Autowired
    private FacultyService facultyService;
    @Autowired
    private DepartmentRepository departmentRepository;

    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    @GetMapping("/hod/dashboard")
    public ResponseEntity<?> getHodDashboard(Principal principal) {
        try {
            Faculty hod = facultyService.getFacultyByUsername(principal.getName());
            String deptCode = hod.getDepartment();

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("totalFaculty", facultyRepository.countByDepartment(deptCode));
            data.put("totalStudents", studentRepository.countByDepartment(deptCode));
            data.put("activeSessions", attendanceSessionRepository.countByIsActiveTrueAndFacultySubjectMap_Faculty_Department(deptCode));

            List<AttendanceSession> deptSessions = attendanceSessionRepository.findByFacultySubjectMap_Faculty_Department(deptCode);
            double avg = calculateAvgAttendance(deptSessions);
            data.put("avgAttendance", avg);

            data.put("weeklyTrends", calculateWeeklyTrends(deptSessions));
            data.put("defaulters", calculateDefaulters(deptCode));
            data.put("facultyPerformance", calculateFacultyPerformance(deptCode));

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    @GetMapping("/hod/faculty-list")
    public ResponseEntity<?> getHodFacultyList(Principal principal) {
        try {
            Faculty hod = facultyService.getFacultyByUsername(principal.getName());
            String deptCode = hod.getDepartment();
            List<Faculty> faculties = facultyRepository.findByDepartment(deptCode);

            List<Map<String, Object>> result = faculties.stream().map(f -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", f.getId());
                String fn = f.getUser().getFirstName() != null ? f.getUser().getFirstName() : "";
                String ln = f.getUser().getLastName() != null ? f.getUser().getLastName() : "";
                m.put("name", (fn + " " + ln).trim());
                m.put("facultyId", f.getFacultyId());
                m.put("designation", f.getDesignation());
                m.put("status", f.getEmploymentStatus() != null ? f.getEmploymentStatus().name() : "ACTIVE");

                List<AttendanceSession> sessions = attendanceSessionRepository
                        .findByFacultySubjectMap_Faculty_Department(deptCode).stream()
                        .filter(s -> s.getFacultySubjectMap().getFaculty().getId().equals(f.getId()))
                        .collect(Collectors.toList());
                m.put("totalSessions", sessions.size());
                m.put("avgAttendance", calculateAvgAttendance(sessions));
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('HOD', 'ADMIN')")
    @GetMapping("/hod/student-list")
    public ResponseEntity<?> getHodStudentList(Principal principal) {
        try {
            Faculty hod = facultyService.getFacultyByUsername(principal.getName());
            String deptCode = hod.getDepartment();
            List<Student> students = studentRepository.findByDepartment(deptCode);

            List<Map<String, Object>> result = students.stream().map(s -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", s.getId());
                m.put("rollNumber", s.getRollNumber());
                String fn = s.getUser() != null && s.getUser().getFirstName() != null ? s.getUser().getFirstName() : "";
                String ln = s.getUser() != null && s.getUser().getLastName() != null ? s.getUser().getLastName() : "";
                m.put("name", (fn + " " + ln).trim());
                m.put("semester", s.getCurrentSemester());
                m.put("section", s.getSection());

                List<AttendanceRecord> records = attendanceRecordRepository.findByStudent(s);
                long present = records.stream()
                        .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                        .count();
                double pct = records.isEmpty() ? 0 : Math.round(((double) present / records.size()) * 100.0 * 10) / 10.0;
                m.put("attendancePercentage", pct);
                m.put("totalPresent", present);
                m.put("totalSessions", records.size());
                m.put("status", pct >= 75 ? "Safe" : pct >= 65 ? "At Risk" : "Critical");
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('PRINCIPAL', 'ADMIN')")
    @GetMapping("/principal/dashboard")
    public ResponseEntity<?> getPrincipalDashboard() {
        try {
            Map<String, Object> data = new LinkedHashMap<>();
            List<AttendanceSession> allSessions = attendanceSessionRepository.findAll();
            
            data.put("collegeAttendance", calculateAvgAttendance(allSessions));
            data.put("activeSessions", attendanceSessionRepository.countByIsActiveTrue());
            
            long totalFac = facultyRepository.count();
            data.put("facultyPresent", Math.max(0, totalFac - 2)); // Dynamic-ish mock
            data.put("totalFaculty", totalFac);
            data.put("criticalAlerts", 2);

            data.put("weeklyTrends", calculateWeeklyTrends(allSessions));

            List<Map<String, Object>> alerts = new ArrayList<>();
            alerts.add(Map.of("dept", "MECH", "msg", "Attendance dropped below 60% in 3 classes", "severity", "error", "time", "2h ago"));
            alerts.add(Map.of("dept", "ECE", "msg", "New student enrollment mapped successfully", "severity", "success", "time", "5h ago"));
            data.put("recentAlerts", alerts);

            List<Department> departments = departmentRepository.findAll();
            List<Map<String, Object>> deptStats = departments.stream().map(d -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", d.getName());
                m.put("code", d.getCode());
                m.put("students", studentRepository.countByDepartment(d.getCode()));
                m.put("faculty", facultyRepository.countByDepartment(d.getCode()));
                List<AttendanceSession> sessions = attendanceSessionRepository.findByFacultySubjectMap_Faculty_Department(d.getCode());
                m.put("avg", calculateAvgAttendance(sessions));
                m.put("trend", "+1.2%");
                m.put("color", getColorForAvg(calculateAvgAttendance(sessions)));
                return m;
            }).collect(Collectors.toList());
            data.put("departments", deptStats);

            data.put("topPerformers", calculateTopPerformers());

            return ResponseEntity.ok(data);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    private String getColorForAvg(double avg) {
        if (avg >= 80) return "#4caf50";
        if (avg >= 70) return "#ff9800";
        return "#f44336";
    }

    private double calculateAvgAttendance(List<AttendanceSession> sessions) {
        if (sessions.isEmpty()) return 0.0;
        long totalPresent = 0;
        long totalRecords = 0;
        for (AttendanceSession s : sessions) {
            List<AttendanceRecord> records = attendanceRecordRepository.findBySession(s);
            totalRecords += records.size();
            totalPresent += records.stream()
                    .filter(r -> r.getStatus() == AttendanceStatus.PRESENT 
                            || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                    .count();
        }
        if (totalRecords == 0) return 0.0;
        return Math.round(((double) totalPresent / totalRecords) * 100.0 * 10) / 10.0;
    }

    private List<Map<String, Object>> calculateWeeklyTrends(List<AttendanceSession> sessions) {
        List<Map<String, Object>> trends = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            List<AttendanceSession> daySessions = sessions.stream()
                    .filter(s -> s.getStartTime().toLocalDate().equals(date))
                    .collect(Collectors.toList());
            
            Map<String, Object> dayMap = new LinkedHashMap<>();
            dayMap.put("day", date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            dayMap.put("value", calculateAvgAttendance(daySessions));
            dayMap.put("classes", (int) daySessions.size());
            trends.add(dayMap);
        }
        return trends;
    }

    private List<Map<String, Object>> calculateDefaulters(String deptCode) {
        List<Student> students = studentRepository.findByDepartment(deptCode);
        List<Map<String, Object>> defaulters = new ArrayList<>();
        
        for (Student s : students) {
            List<AttendanceRecord> records = attendanceRecordRepository.findByStudent(s);
            if (records.size() < 3) continue; // Minimum threshold
            
            long present = records.stream()
                    .filter(r -> r.getStatus() == AttendanceStatus.PRESENT 
                            || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                    .count();
            double pct = Math.round(((double) present / records.size()) * 100.0 * 10) / 10.0;
            
            if (pct < 75.0) {
                Map<String, Object> m = new LinkedHashMap<>();
                String fn = s.getUser().getFirstName() != null ? s.getUser().getFirstName() : "";
                String ln = s.getUser().getLastName() != null ? s.getUser().getLastName() : "";
                m.put("name", (fn + " " + ln).trim());
                m.put("rollNo", s.getRollNumber());
                m.put("status", pct < 60.0 ? "Critical" : "Warning");
                m.put("val", pct);
                defaulters.add(m);
            }
        }
        
        defaulters.sort((a, b) -> Double.compare((double)a.get("val"), (double)b.get("val")));
        return defaulters.stream().limit(5).collect(Collectors.toList());
    }

    private List<Map<String, Object>> calculateFacultyPerformance(String deptCode) {
        List<Faculty> faculties = facultyRepository.findByDepartment(deptCode);
        List<Map<String, Object>> performance = new ArrayList<>();
        
        for (Faculty f : faculties) {
            List<AttendanceSession> sessions = attendanceSessionRepository.findByFacultySubjectMap_Faculty_Department(deptCode).stream()
                    .filter(s -> s.getFacultySubjectMap().getFaculty().getId().equals(f.getId()))
                    .collect(Collectors.toList());
            
            if (sessions.isEmpty()) continue;
            
            Map<String, Object> m = new LinkedHashMap<>();
            String fn = f.getUser().getFirstName() != null ? f.getUser().getFirstName() : "";
            String ln = f.getUser().getLastName() != null ? f.getUser().getLastName() : "";
            m.put("name", (fn + " " + ln).trim());
            m.put("subject", sessions.get(0).getFacultySubjectMap().getSubject().getName());
            m.put("avg", calculateAvgAttendance(sessions));
            m.put("sessions", sessions.size());
            performance.add(m);
        }
        return performance;
    }

    private List<Map<String, Object>> calculateTopPerformers() {
        List<Faculty> faculties = facultyRepository.findAll();
        List<Map<String, Object>> performers = new ArrayList<>();
        
        for (Faculty f : faculties) {
            List<AttendanceSession> allSessions = attendanceSessionRepository.findAll();
            List<AttendanceSession> sessions = allSessions.stream()
                    .filter(s -> {
                        if (s.getFacultySubjectMap() != null) {
                            return s.getFacultySubjectMap().getFaculty().getId().equals(f.getId());
                        } else if (Boolean.TRUE.equals(s.getIsLabSession())) {
                            return f.getId().equals(s.getCreatedByFacultyId());
                        }
                        return false;
                    })
                    .collect(Collectors.toList());
            
            if (sessions.isEmpty()) continue;
            
            Map<String, Object> m = new LinkedHashMap<>();
            String fn = f.getUser().getFirstName() != null ? f.getUser().getFirstName() : "";
            String ln = f.getUser().getLastName() != null ? f.getUser().getLastName() : "";
            m.put("name", (fn + " " + ln).trim());
            m.put("dept", f.getDepartment());
            m.put("avg", calculateAvgAttendance(sessions));
            performers.add(m);
        }
        
        performers.sort((a, b) -> Double.compare((double)b.get("avg"), (double)a.get("avg")));
        return performers.stream().limit(3).collect(Collectors.toList());
    }
}
