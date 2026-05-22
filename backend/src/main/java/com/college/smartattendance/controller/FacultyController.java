package com.college.smartattendance.controller;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.service.FacultyService;
import com.college.smartattendance.service.AttendanceService;
import com.college.smartattendance.repository.FacultySubjectMapRepository;
import com.college.smartattendance.repository.AttendanceRecordRepository;
import com.college.smartattendance.repository.AttendanceSessionRepository;
import com.college.smartattendance.repository.StudentClassMapRepository;
import com.college.smartattendance.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    @Autowired
    private StudentClassMapRepository studentClassMapRepository;

    @Autowired
    private com.college.smartattendance.repository.LabFacultyAssignmentRepository labFacultyAssignmentRepository;

    // ══════════════════════════════════════════════════════════════════
    //  DASHBOARD OVERVIEW
    // ══════════════════════════════════════════════════════════════════

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboardStats(Principal principal) {
        try {
            Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
            List<FacultySubjectMap> maps = facultySubjectMapRepository.findByFaculty_Id(faculty.getId());
            List<LabFacultyAssignment> labAssignments = labFacultyAssignmentRepository.findByFaculty_Id(faculty.getId());

            // Get all sessions for this faculty (Regular + Lab)
            List<AttendanceSession> allSessions = new ArrayList<>();
            
            // Regular sessions
            for (FacultySubjectMap map : maps) {
                allSessions.addAll(attendanceSessionRepository.findByFacultySubjectMap_Id(map.getId()));
            }
            
            // Lab sessions
            allSessions.addAll(attendanceSessionRepository.findByCreatedByFacultyId(faculty.getId())
                    .stream().filter(s -> Boolean.TRUE.equals(s.getIsLabSession())).collect(Collectors.toList()));

            // Sort by most recent
            allSessions.sort((a, b) -> b.getStartTime().compareTo(a.getStartTime()));

            int totalSessions = allSessions.size();
            int activeSessions = (int) allSessions.stream().filter(AttendanceSession::isActive).count();
            LocalDate today = LocalDate.now();
            int todaySessions = (int) allSessions.stream()
                    .filter(s -> s.getStartTime().toLocalDate().equals(today))
                    .count();

            // Calculate average attendance based on class size
            double avgAttendance = 0;
            long totalExpectedMarks = 0;
            long totalPresent = 0;
            for (AttendanceSession s : allSessions) {
                // Ignore active sessions for historical average unless they have marks
                if (s.isActive() && LocalDateTime.now().isBefore(s.getEndTime())) continue;

                Long classId = s.getFacultySubjectMap() != null ? s.getFacultySubjectMap().getCourseClass().getId() : null;
                // If lab session, we need to find the class. For now we assume the session or record can tell us.
                // Fallback: use labAssignment if we can find it.
                if (classId == null && s.getIsLabSession()) {
                     // Try to find the assignment to get classId
                     Optional<LabFacultyAssignment> lfa = labAssignments.stream()
                         .filter(a -> a.getLabSubject().getId().equals(s.getLabSubject().getId()))
                         .findFirst();
                     if (lfa.isPresent()) classId = lfa.get().getCourseClass().getId();
                }

                if (classId != null) {
                    long classSize = studentClassMapRepository.countByCourseClass_Id(classId);
                    totalExpectedMarks += classSize;

                    List<AttendanceRecord> records = attendanceRecordRepository.findBySession(s);
                    totalPresent += (int) records.stream()
                            .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                    || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                            .count();
                }
            }
            if (totalExpectedMarks > 0) {
                avgAttendance = Math.round(((double) totalPresent / totalExpectedMarks) * 100.0 * 10) / 10.0;
            }

            // Count unique classes
            Set<Long> uniqueClassIds = maps.stream()
                    .map(m -> m.getCourseClass().getId())
                    .collect(Collectors.toSet());
            labAssignments.forEach(la -> uniqueClassIds.add(la.getCourseClass().getId()));

            // Count unique subjects
            Set<Long> uniqueSubjectIds = maps.stream()
                    .map(m -> m.getSubject().getId())
                    .collect(Collectors.toSet());
            labAssignments.forEach(la -> uniqueSubjectIds.add(la.getLabSubject().getId()));

            // Recent 5 sessions
            List<Map<String, Object>> recentSessions = allSessions.stream()
                    .limit(5)
                    .map(s -> {
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("sessionId", s.getId());
                        if (s.getFacultySubjectMap() != null) {
                            item.put("subjectName", s.getFacultySubjectMap().getSubject().getName());
                            item.put("subjectCode", s.getFacultySubjectMap().getSubject().getCode());
                            item.put("className", s.getFacultySubjectMap().getCourseClass().getName());
                        } else {
                            item.put("subjectName", s.getLabSubject() != null ? s.getLabSubject().getName() : "Lab");
                            item.put("subjectCode", s.getLabSubject() != null ? s.getLabSubject().getCode() : "LAB");
                            item.put("className", "Lab Session");
                        }
                        item.put("startTime", s.getStartTime());
                        item.put("endTime", s.getEndTime());
                        item.put("isActive", s.isActive());
                        item.put("period", s.getPeriod() != null ? s.getPeriod() : "N/A");
                        int count = (int) attendanceRecordRepository.findBySession(s).stream()
                                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                        || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                                .count();
                        item.put("presentCount", count);
                        item.put("totalRecords", attendanceRecordRepository.findBySession(s).size());
                        return item;
                    }).collect(Collectors.toList());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("totalSessions", totalSessions);
            result.put("todaySessions", todaySessions);
            result.put("activeSessions", activeSessions);
            result.put("totalClasses", uniqueClassIds.size());
            result.put("totalSubjects", uniqueSubjectIds.size());
            result.put("avgAttendance", avgAttendance);
            result.put("totalStudentsMarked", totalPresent);
            result.put("recentSessions", recentSessions);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  SESSION HISTORY
    // ══════════════════════════════════════════════════════════════════

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
    @GetMapping("/sessions/history")
    public ResponseEntity<?> getSessionHistory(Principal principal,
            @RequestParam(defaultValue = "50") int limit) {
        try {
            Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
            List<FacultySubjectMap> maps = facultySubjectMapRepository.findByFaculty_Id(faculty.getId());
            List<LabFacultyAssignment> labAssignments = labFacultyAssignmentRepository.findByFaculty_Id(faculty.getId());

            List<AttendanceSession> allSessions = new ArrayList<>();
            for (FacultySubjectMap map : maps) {
                allSessions.addAll(attendanceSessionRepository.findByFacultySubjectMap_Id(map.getId()));
            }
            allSessions.addAll(attendanceSessionRepository.findByCreatedByFacultyId(faculty.getId())
                    .stream().filter(s -> Boolean.TRUE.equals(s.getIsLabSession())).collect(Collectors.toList()));

            allSessions.sort((a, b) -> b.getStartTime().compareTo(a.getStartTime()));

            List<Map<String, Object>> result = allSessions.stream()
                    .limit(limit)
                    .map(s -> {
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("sessionId", s.getId());
                        if (s.getFacultySubjectMap() != null) {
                            item.put("subjectName", s.getFacultySubjectMap().getSubject().getName());
                            item.put("subjectCode", s.getFacultySubjectMap().getSubject().getCode());
                            item.put("className", s.getFacultySubjectMap().getCourseClass().getName());
                            item.put("section", s.getFacultySubjectMap().getSection());
                        } else {
                            item.put("subjectName", s.getLabSubject() != null ? s.getLabSubject().getName() : "Lab");
                            item.put("subjectCode", s.getLabSubject() != null ? s.getLabSubject().getCode() : "LAB");
                            item.put("className", "Lab Session");
                            item.put("section", "N/A");
                        }
                        item.put("startTime", s.getStartTime());
                        item.put("endTime", s.getEndTime());
                        item.put("isActive", s.isActive());
                        item.put("latitude", s.getLatitude());
                        item.put("longitude", s.getLongitude());
                        item.put("radius", s.getRadius());
                        item.put("period", s.getPeriod() != null ? s.getPeriod() : "N/A");

                        List<AttendanceRecord> records = attendanceRecordRepository.findBySession(s);
                        int present = (int) records.stream()
                                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                        || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                                .count();
                        int rejected = (int) records.stream()
                                .filter(r -> r.getStatus() == AttendanceStatus.REJECTED)
                                .count();

                        item.put("presentCount", present);
                        item.put("absentCount", rejected);
                        item.put("totalRecords", records.size());

                        // Calculate attendance percentage
                        // We need to know total students in the class
                        long totalClassStudents = 0;
                        try {
                            Long classId = s.getFacultySubjectMap() != null ? s.getFacultySubjectMap().getCourseClass().getId()
                                    : (s.getCourseClass() != null ? s.getCourseClass().getId() : null);
                            if (classId != null) {
                                totalClassStudents = studentClassMapRepository.countByCourseClass_Id(classId);
                            }
                        } catch (Exception e) {
                            // fallback
                        }
                        item.put("totalClassStudents", totalClassStudents);

                        return item;
                    }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  CLASS-WISE STATS
    // ══════════════════════════════════════════════════════════════════

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
    @GetMapping("/class-stats")
    public ResponseEntity<?> getClassStats(Principal principal) {
        try {
            Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
            List<FacultySubjectMap> maps = facultySubjectMapRepository.findByFaculty_Id(faculty.getId());

            List<Map<String, Object>> result = maps.stream().map(m -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("mappingId", m.getId());
                item.put("isLab", false);
                item.put("subjectName", m.getSubject().getName());
                item.put("subjectCode", m.getSubject().getCode());
                item.put("className", m.getCourseClass().getName());
                item.put("classId", m.getCourseClass().getId());
                item.put("section", m.getSection());
                item.put("academicYear", m.getAcademicYear() != null ? m.getAcademicYear().getName() : null);

                // Get all sessions for this mapping
                List<AttendanceSession> sessions = attendanceSessionRepository
                        .findByFacultySubjectMap_Id(m.getId());
                item.put("totalSessions", sessions.size());

                // Count students in this class
                long totalClassStudents = studentClassMapRepository
                        .countByCourseClass_Id(m.getCourseClass().getId());
                item.put("totalStudents", totalClassStudents);

                // Aggregate attendance relative to class size
                long totalPresent = 0;
                long totalExpected = 0;
                for (AttendanceSession s : sessions) {
                    if (s.isActive() && LocalDateTime.now().isBefore(s.getEndTime())) continue;
                    
                    totalExpected += totalClassStudents;
                    List<AttendanceRecord> records = attendanceRecordRepository.findBySession(s);
                    totalPresent += (int) records.stream()
                            .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                    || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                            .count();
                }

                double avgPercentage = totalExpected == 0 ? 0
                        : Math.round(((double) totalPresent / totalExpected) * 100.0 * 10) / 10.0;

                item.put("avgAttendancePercentage", avgPercentage);
                item.put("totalPresentMarks", totalPresent);
                item.put("totalExpectedMarks", totalExpected);

                // Last session date
                sessions.stream()
                        .max(Comparator.comparing(AttendanceSession::getStartTime))
                        .ifPresent(latest -> item.put("lastSessionDate", latest.getStartTime()));

                return item;
            }).collect(Collectors.toList());

            List<LabFacultyAssignment> labAssignments = labFacultyAssignmentRepository.findByFaculty_Id(faculty.getId());
            
            labAssignments.forEach(la -> {
                try {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("mappingId", la.getId());
                    item.put("isLab", true);
                    
                    String subjectName = "Unknown Lab";
                    String subjectCode = "LAB";
                    Long subjectId = -1L;
                    try {
                        if (la.getLabSubject() != null) {
                            subjectName = la.getLabSubject().getName();
                            subjectCode = la.getLabSubject().getCode();
                            subjectId = la.getLabSubject().getId();
                        }
                    } catch (Exception e) {}
                    
                    item.put("subjectName", subjectName);
                    item.put("subjectCode", subjectCode);
                    
                    String className = "Unknown Class";
                    Long classId = -1L;
                    try {
                        if (la.getCourseClass() != null) {
                            className = la.getCourseClass().getName();
                            classId = la.getCourseClass().getId();
                        }
                    } catch (Exception e) {}
                    
                    item.put("className", className);
                    item.put("classId", classId);
                    item.put("section", "LAB");
                    
                    String academicYear = null;
                    try {
                        if (la.getAcademicYear() != null) {
                            academicYear = la.getAcademicYear().getName();
                        }
                    } catch (Exception e) {}
                    item.put("academicYear", academicYear);

                    // Get all sessions for this lab mapping
                    final Long finalSubjectId = subjectId;
                    List<AttendanceSession> sessions = attendanceSessionRepository.findByCreatedByFacultyId(faculty.getId())
                        .stream().filter(s -> Boolean.TRUE.equals(s.getIsLabSession()) && s.getLabSubject() != null && s.getLabSubject().getId().equals(finalSubjectId)).collect(Collectors.toList());
                    item.put("totalSessions", sessions.size());

                    // Count students in this class
                    long totalClassStudents = 0;
                    try {
                        if (classId != -1L) {
                            totalClassStudents = studentClassMapRepository.countByCourseClass_Id(classId);
                        }
                    } catch(Exception e) {}
                    item.put("totalStudents", totalClassStudents);

                    // Aggregate attendance relative to class size
                    long totalPresent = 0;
                    long totalExpected = 0;
                    for (AttendanceSession s : sessions) {
                        if (s.isActive() && LocalDateTime.now().isBefore(s.getEndTime())) continue;
                        
                        totalExpected += totalClassStudents;
                        List<AttendanceRecord> records = attendanceRecordRepository.findBySession(s);
                        totalPresent += (int) records.stream()
                                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                        || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                                .count();
                    }

                    double avgPercentage = totalExpected == 0 ? 0
                            : Math.round(((double) totalPresent / totalExpected) * 100.0 * 10) / 10.0;

                    item.put("avgAttendancePercentage", avgPercentage);
                    item.put("totalPresentMarks", totalPresent);
                    item.put("totalExpectedMarks", totalExpected);

                    sessions.stream()
                            .max(Comparator.comparing(AttendanceSession::getStartTime))
                            .ifPresent(latest -> item.put("lastSessionDate", latest.getStartTime()));

                    result.add(item);
                } catch (Exception e) {
                    // Skip gracefully
                }
            });

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace(); // Log error for debugging
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  DETAILED SESSION REPORT
    // ══════════════════════════════════════════════════════════════════

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
    @GetMapping("/sessions/{sessionId}/report")
    public ResponseEntity<?> getSessionReport(@PathVariable Long sessionId) {
        try {
            AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found"));

            Map<String, Object> report = new LinkedHashMap<>();
            report.put("sessionId", session.getId());
            if (session.getFacultySubjectMap() != null) {
                report.put("subjectName", session.getFacultySubjectMap().getSubject().getName());
                report.put("subjectCode", session.getFacultySubjectMap().getSubject().getCode());
                report.put("className", session.getFacultySubjectMap().getCourseClass().getName());
                report.put("section", session.getFacultySubjectMap().getSection());
            } else {
                report.put("subjectName", session.getLabSubject() != null ? session.getLabSubject().getName() : "Lab");
                report.put("subjectCode", session.getLabSubject() != null ? session.getLabSubject().getCode() : "LAB");
                report.put("className", "Lab Session");
                report.put("section", "LAB");
            }
            report.put("startTime", session.getStartTime());
            report.put("endTime", session.getEndTime());
            report.put("isActive", session.isActive());
            report.put("latitude", session.getLatitude());
            report.put("longitude", session.getLongitude());
            report.put("radius", session.getRadius());

            List<AttendanceRecord> records = attendanceRecordRepository.findBySession(session);

            int present = (int) records.stream()
                    .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                            || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                    .count();
            int rejected = (int) records.stream()
                    .filter(r -> r.getStatus() == AttendanceStatus.REJECTED)
                    .count();

            report.put("presentCount", present);
            report.put("absentCount", rejected);
            report.put("totalRecords", records.size());

            // Student-wise detail
            List<Map<String, Object>> studentDetails = records.stream().map(r -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("recordId", r.getId());
                item.put("studentId", r.getStudent().getId());
                item.put("rollNumber",
                        r.getStudent().getUser() != null ? r.getStudent().getUser().getUsername() : "");
                item.put("studentName",
                        (r.getStudent().getUser() != null
                                ? ((r.getStudent().getUser().getFirstName() != null
                                        ? r.getStudent().getUser().getFirstName()
                                        : "") +
                                        " " +
                                        (r.getStudent().getUser().getLastName() != null
                                                ? r.getStudent().getUser().getLastName()
                                                : "")).trim()
                                : "Unknown"));
                item.put("status", r.getStatus().name());
                item.put("remarks", r.getRemarks());
                item.put("timestamp", r.getTimestamp());
                return item;
            }).collect(Collectors.toList());

            report.put("students", studentDetails);

            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  EXISTING ENDPOINTS (preserved)
    // ══════════════════════════════════════════════════════════════════

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
    @GetMapping("/mappings")
    public ResponseEntity<?> getFacultyMappings(Principal principal) {
        try {
            Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
            List<FacultySubjectMap> maps = facultySubjectMapRepository.findByFaculty_Id(faculty.getId());
            List<LabFacultyAssignment> labAssignments = labFacultyAssignmentRepository.findByFaculty_Id(faculty.getId());

            List<Map<String, Object>> result = maps.stream().map(m -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", m.getId());
                item.put("isLab", false);
                item.put("subjectName", m.getSubject().getName());
                item.put("subjectCode", m.getSubject().getCode());
                item.put("className", m.getCourseClass().getName());
                item.put("classId", m.getCourseClass().getId());
                item.put("section", m.getSection());
                item.put("academicYear", m.getAcademicYear() != null ? m.getAcademicYear().getName() : null);
                return item;
            }).collect(Collectors.toList());

            labAssignments.forEach(la -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", la.getId());
                item.put("isLab", true);
                item.put("subjectName", la.getLabSubject().getName());
                item.put("subjectCode", la.getLabSubject().getCode());
                item.put("className", la.getCourseClass().getName());
                item.put("classId", la.getCourseClass().getId());
                item.put("section", "LAB");
                item.put("academicYear", la.getAcademicYear() != null ? la.getAcademicYear().getName() : null);
                result.add(item);
            });

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
    @PostMapping("/sessions")
    public ResponseEntity<?> createSession(
            @RequestBody Map<String, Object> payload, Principal principal) {
        try {
            Long mapId = Long.parseLong(payload.get("mapId").toString());
            Double lat = Double.parseDouble(payload.get("lat").toString());
            Double lon = Double.parseDouble(payload.get("lon").toString());
            Integer duration = Integer.parseInt(payload.get("duration").toString());
            Double radius = payload.containsKey("radius") ? Double.parseDouble(payload.get("radius").toString()) : 50.0;
            String period = payload.containsKey("period") ? payload.get("period").toString() : "N/A";
            Integer numberOfHours = payload.containsKey("numberOfHours") ? Integer.parseInt(payload.get("numberOfHours").toString()) : 1;
            Boolean isLab = payload.containsKey("isLab") ? Boolean.parseBoolean(payload.get("isLab").toString()) : false;
            
            AttendanceSession session;
            if (isLab) {
                LabFacultyAssignment la = labFacultyAssignmentRepository.findById(mapId)
                    .orElseThrow(() -> new RuntimeException("Lab assignment not found"));
                
                Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
                session = attendanceService.createLabSession(la.getLabSubject().getId(), la.getCourseClass().getId(), faculty.getId(), lat, lon, duration, radius, period, numberOfHours);
            } else {
                session = attendanceService.createSession(mapId, lat, lon, duration, radius, period, numberOfHours);
            }

            // Return a stable DTO-like payload
            return ResponseEntity.ok(Map.of(
                    "sessionId", session.getId(),
                    "qrToken", session.getQrToken(),
                    "startTime", session.getStartTime(),
                    "endTime", session.getEndTime(),
                    "radius", session.getRadius(),
                    "latitude", session.getLatitude(),
                    "longitude", session.getLongitude(),
                    "period", session.getPeriod() != null ? session.getPeriod() : "N/A",
                    "numberOfHours", session.getNumberOfHours() != null ? session.getNumberOfHours() : 1
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
    @PostMapping("/sessions/{sessionId}/refresh-qr")
    public ResponseEntity<?> refreshQrToken(@PathVariable Long sessionId) {
        try {
            AttendanceSession session = attendanceService.refreshQrToken(sessionId);
            return ResponseEntity.ok(Map.of(
                    "qrToken", session.getQrToken(),
                    "sessionId", session.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
    @PostMapping("/sessions/{sessionId}/end")
    public ResponseEntity<?> endSession(@PathVariable Long sessionId) {
        try {
            attendanceService.endSession(sessionId);
            return ResponseEntity.ok(Map.of("message", "Session ended successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
    @PostMapping("/sessions/{sessionId}/cancel")
    public ResponseEntity<?> cancelSession(@PathVariable Long sessionId) {
        try {
            attendanceService.cancelSession(sessionId);
            return ResponseEntity.ok(Map.of("message", "Session cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }


    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
    @GetMapping("/sessions/{sessionId}/count")
    public ResponseEntity<?> getSessionAttendanceCount(@PathVariable Long sessionId) {
        try {
            int count = attendanceService.getSessionAttendanceCount(sessionId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
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
                item.put("rollNumber",
                        r.getStudent().getUser() != null ? r.getStudent().getUser().getUsername() : "");
                item.put("studentName",
                        (r.getStudent().getUser() != null
                                ? ((r.getStudent().getUser().getFirstName() != null
                                        ? r.getStudent().getUser().getFirstName()
                                        : "") +
                                        " " +
                                        (r.getStudent().getUser().getLastName() != null
                                                ? r.getStudent().getUser().getLastName()
                                                : "")).trim()
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

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
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

    @PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
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
