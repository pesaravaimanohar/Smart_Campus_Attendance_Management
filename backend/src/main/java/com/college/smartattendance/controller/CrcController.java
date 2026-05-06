package com.college.smartattendance.controller;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import com.college.smartattendance.service.FacultyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * CRC (Class Representative Coordinator) Controller.
 * A CRC is a faculty member assigned to oversee a class.
 * This controller provides class-level attendance insights for CRC faculty.
 */
@RestController
@RequestMapping("/api/crc")
@PreAuthorize("hasAnyRole('FACULTY','HOD','PRINCIPAL')")
public class CrcController {

    @Autowired
    private FacultyService facultyService;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private StudentClassMapRepository studentClassMapRepository;

    @Autowired
    private FacultySubjectMapRepository facultySubjectMapRepository;

    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    // ══════════════════════════════════════════════════════════════════
    //  GET MY CLASSES (where I am CRC)
    // ══════════════════════════════════════════════════════════════════

    @GetMapping("/my-classes")
    public ResponseEntity<?> getMyClasses(Principal principal) {
        try {
            Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
            List<CourseClass> classes = courseClassRepository.findByCrc_Id(faculty.getId());

            List<Map<String, Object>> result = classes.stream().map(cc -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("classId", cc.getId());
                item.put("className", cc.getName());
                item.put("department", cc.getDepartment());
                item.put("yearLevel", cc.getYearLevel());
                item.put("programType", cc.getProgramType() != null ? cc.getProgramType().name() : null);

                // Student count
                long studentCount = studentClassMapRepository.countByCourseClass_Id(cc.getId());
                item.put("totalStudents", studentCount);

                // Subject count & faculty count
                List<FacultySubjectMap> maps = facultySubjectMapRepository.findByCourseClass_Id(cc.getId());
                Set<Long> subjectIds = maps.stream().map(m -> m.getSubject().getId()).collect(Collectors.toSet());
                Set<Long> facultyIds = maps.stream().map(m -> m.getFaculty().getId()).collect(Collectors.toSet());
                item.put("totalSubjects", subjectIds.size());
                item.put("totalFaculty", facultyIds.size());

                // Average attendance across all subjects in this class
                double avg = calculateClassAvgAttendance(maps);
                item.put("avgAttendance", avg);

                return item;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  CLASS OVERVIEW
    // ══════════════════════════════════════════════════════════════════

    @GetMapping("/class/{classId}/overview")
    public ResponseEntity<?> getClassOverview(@PathVariable Long classId, Principal principal) {
        try {
            Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
            CourseClass cc = courseClassRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Class not found"));

            // Verify CRC ownership
            if (cc.getCrc() == null || !cc.getCrc().getId().equals(faculty.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "You are not the CRC for this class"));
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("classId", cc.getId());
            result.put("className", cc.getName());
            result.put("department", cc.getDepartment());
            result.put("yearLevel", cc.getYearLevel());
            result.put("programType", cc.getProgramType() != null ? cc.getProgramType().name() : null);

            long studentCount = studentClassMapRepository.countByCourseClass_Id(cc.getId());
            result.put("totalStudents", studentCount);

            List<FacultySubjectMap> maps = facultySubjectMapRepository.findByCourseClass_Id(cc.getId());
            Set<Long> subjectIds = maps.stream().map(m -> m.getSubject().getId()).collect(Collectors.toSet());
            result.put("totalSubjects", subjectIds.size());

            // Total sessions across all subjects in this class
            int totalSessions = 0;
            for (FacultySubjectMap map : maps) {
                totalSessions += attendanceSessionRepository.findByFacultySubjectMap_Id(map.getId()).size();
            }
            result.put("totalSessions", totalSessions);

            double avg = calculateClassAvgAttendance(maps);
            result.put("avgAttendance", avg);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  CLASS STUDENTS — with attendance percentage per student
    // ══════════════════════════════════════════════════════════════════

    @GetMapping("/class/{classId}/students")
    public ResponseEntity<?> getClassStudents(@PathVariable Long classId, Principal principal) {
        try {
            Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
            CourseClass cc = courseClassRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Class not found"));

            if (cc.getCrc() == null || !cc.getCrc().getId().equals(faculty.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "You are not the CRC for this class"));
            }

            List<StudentClassMap> studentMaps = studentClassMapRepository.findByCourseClass_Id(classId);
            List<FacultySubjectMap> classMaps = facultySubjectMapRepository.findByCourseClass_Id(classId);

            // Build session set for this class
            List<AttendanceSession> classSessions = new ArrayList<>();
            for (FacultySubjectMap map : classMaps) {
                classSessions.addAll(attendanceSessionRepository.findByFacultySubjectMap_Id(map.getId()));
            }

            List<Map<String, Object>> result = studentMaps.stream().map(scm -> {
                Student s = scm.getStudent();
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("studentId", s.getId());
                item.put("rollNumber", s.getRollNumber());

                String fn = s.getUser() != null && s.getUser().getFirstName() != null ? s.getUser().getFirstName() : "";
                String ln = s.getUser() != null && s.getUser().getLastName() != null ? s.getUser().getLastName() : "";
                item.put("name", (fn + " " + ln).trim());
                item.put("semester", s.getCurrentSemester());

                // Calculate attendance for this student across class sessions
                int totalRecords = 0;
                int presentCount = 0;
                for (AttendanceSession session : classSessions) {
                    List<AttendanceRecord> records = attendanceRecordRepository.findBySession(session);
                    for (AttendanceRecord r : records) {
                        if (r.getStudent().getId().equals(s.getId())) {
                            totalRecords++;
                            if (r.getStatus() == AttendanceStatus.PRESENT
                                    || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED) {
                                presentCount++;
                            }
                        }
                    }
                }

                double pct = totalRecords == 0 ? 0 :
                        Math.round(((double) presentCount / totalRecords) * 100.0 * 10) / 10.0;
                item.put("attendancePercentage", pct);
                item.put("totalPresent", presentCount);
                item.put("totalSessions", totalRecords);
                item.put("status", pct >= 75 ? "Safe" : pct >= 65 ? "At Risk" : "Critical");

                return item;
            }).sorted((a, b) -> Double.compare(
                    (double) b.get("attendancePercentage"),
                    (double) a.get("attendancePercentage")
            )).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  CLASS SUBJECTS — with stats per subject
    // ══════════════════════════════════════════════════════════════════

    @GetMapping("/class/{classId}/subjects")
    public ResponseEntity<?> getClassSubjects(@PathVariable Long classId, Principal principal) {
        try {
            Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
            CourseClass cc = courseClassRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Class not found"));

            if (cc.getCrc() == null || !cc.getCrc().getId().equals(faculty.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "You are not the CRC for this class"));
            }

            List<FacultySubjectMap> maps = facultySubjectMapRepository.findByCourseClass_Id(classId);

            List<Map<String, Object>> result = maps.stream().map(m -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("mappingId", m.getId());
                item.put("subjectName", m.getSubject().getName());
                item.put("subjectCode", m.getSubject().getCode());

                String fn = m.getFaculty().getUser() != null && m.getFaculty().getUser().getFirstName() != null
                        ? m.getFaculty().getUser().getFirstName() : "";
                String ln = m.getFaculty().getUser() != null && m.getFaculty().getUser().getLastName() != null
                        ? m.getFaculty().getUser().getLastName() : "";
                item.put("facultyName", (fn + " " + ln).trim());
                item.put("section", m.getSection());

                List<AttendanceSession> sessions = attendanceSessionRepository.findByFacultySubjectMap_Id(m.getId());
                item.put("totalSessions", sessions.size());

                int totalPresent = 0;
                int totalRecords = 0;
                for (AttendanceSession s : sessions) {
                    List<AttendanceRecord> records = attendanceRecordRepository.findBySession(s);
                    totalRecords += records.size();
                    totalPresent += (int) records.stream()
                            .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                    || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                            .count();
                }

                double avg = totalRecords == 0 ? 0 :
                        Math.round(((double) totalPresent / totalRecords) * 100.0 * 10) / 10.0;
                item.put("avgAttendance", avg);
                item.put("totalPresent", totalPresent);
                item.put("totalRecords", totalRecords);

                return item;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  CLASS DEFAULTERS — students below 75%
    // ══════════════════════════════════════════════════════════════════

    @GetMapping("/class/{classId}/defaulters")
    public ResponseEntity<?> getClassDefaulters(@PathVariable Long classId, Principal principal) {
        try {
            Faculty faculty = facultyService.getFacultyByUsername(principal.getName());
            CourseClass cc = courseClassRepository.findById(classId)
                    .orElseThrow(() -> new RuntimeException("Class not found"));

            if (cc.getCrc() == null || !cc.getCrc().getId().equals(faculty.getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "You are not the CRC for this class"));
            }

            List<StudentClassMap> studentMaps = studentClassMapRepository.findByCourseClass_Id(classId);
            List<FacultySubjectMap> classMaps = facultySubjectMapRepository.findByCourseClass_Id(classId);

            List<AttendanceSession> classSessions = new ArrayList<>();
            for (FacultySubjectMap map : classMaps) {
                classSessions.addAll(attendanceSessionRepository.findByFacultySubjectMap_Id(map.getId()));
            }

            List<Map<String, Object>> defaulters = new ArrayList<>();

            for (StudentClassMap scm : studentMaps) {
                Student s = scm.getStudent();
                int totalRecords = 0;
                int presentCount = 0;
                for (AttendanceSession session : classSessions) {
                    List<AttendanceRecord> records = attendanceRecordRepository.findBySession(session);
                    for (AttendanceRecord r : records) {
                        if (r.getStudent().getId().equals(s.getId())) {
                            totalRecords++;
                            if (r.getStatus() == AttendanceStatus.PRESENT
                                    || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED) {
                                presentCount++;
                            }
                        }
                    }
                }

                if (totalRecords < 2) continue; // Need minimum data

                double pct = Math.round(((double) presentCount / totalRecords) * 100.0 * 10) / 10.0;

                if (pct < 75.0) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("studentId", s.getId());
                    item.put("rollNumber", s.getRollNumber());
                    String fn = s.getUser() != null && s.getUser().getFirstName() != null ? s.getUser().getFirstName() : "";
                    String ln = s.getUser() != null && s.getUser().getLastName() != null ? s.getUser().getLastName() : "";
                    item.put("name", (fn + " " + ln).trim());
                    item.put("attendancePercentage", pct);
                    item.put("totalPresent", presentCount);
                    item.put("totalSessions", totalRecords);
                    item.put("status", pct < 60 ? "Critical" : "Warning");
                    defaulters.add(item);
                }
            }

            defaulters.sort((a, b) -> Double.compare(
                    (double) a.get("attendancePercentage"),
                    (double) b.get("attendancePercentage")
            ));

            return ResponseEntity.ok(defaulters);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════════════
    //  HELPER
    // ══════════════════════════════════════════════════════════════════

    private double calculateClassAvgAttendance(List<FacultySubjectMap> maps) {
        int totalPresent = 0;
        int totalRecords = 0;
        for (FacultySubjectMap map : maps) {
            List<AttendanceSession> sessions = attendanceSessionRepository.findByFacultySubjectMap_Id(map.getId());
            for (AttendanceSession s : sessions) {
                List<AttendanceRecord> records = attendanceRecordRepository.findBySession(s);
                totalRecords += records.size();
                totalPresent += (int) records.stream()
                        .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                        .count();
            }
        }
        if (totalRecords == 0) return 0;
        return Math.round(((double) totalPresent / totalRecords) * 100.0 * 10) / 10.0;
    }
}
