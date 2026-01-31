package com.college.smartattendance.service;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

        @Autowired
        private AttendanceSessionRepository sessionRepository;

        @Autowired
        private AttendanceRecordRepository recordRepository;

        @Autowired
        private StudentRepository studentRepository;

        @Autowired
        private FacultySubjectMapRepository facultySubjectMapRepository;

        @Transactional
        public AttendanceSession createSession(Long facultySubjectMapId, Double lat, Double lon,
                        Integer durationMinutes,
                        Double radius) {
                FacultySubjectMap map = facultySubjectMapRepository.findById(facultySubjectMapId)
                                .orElseThrow(() -> new RuntimeException("Mapping not found"));

                AttendanceSession session = new AttendanceSession();
                session.setFacultySubjectMap(map);
                session.setStartTime(LocalDateTime.now());
                session.setEndTime(LocalDateTime.now().plusMinutes(durationMinutes));
                session.setActive(true);
                session.setLatitude(lat);
                session.setLongitude(lon);
                session.setRadius(radius != null ? radius : 50.0);

                return sessionRepository.save(session);
        }

        @Transactional
        public AttendanceRecord markAttendance(Long studentId, Long sessionId, Double lat, Double lon,
                        String imagePath) {
                AttendanceSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found"));

                if (!session.isActive() || LocalDateTime.now().isAfter(session.getEndTime())) {
                        throw new RuntimeException("Session expired");
                }

                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                // Check already marked
                Optional<AttendanceRecord> existing = recordRepository.findBySessionAndStudent(session, student);
                if (existing.isPresent()) {
                        return existing.get();
                }

                // Validate Location (Simple distance check)
                double distance = calculateDistance(lat, lon, session.getLatitude(), session.getLongitude());
                AttendanceStatus status = AttendanceStatus.PRESENT;
                String remarks = "Verified";

                if (distance > session.getRadius()) {
                        status = AttendanceStatus.REJECTED;
                        remarks = "Location Mismatch: " + String.format("%.2f", distance) + "m";
                }

                AttendanceRecord record = new AttendanceRecord();
                record.setSession(session);
                record.setStudent(student);
                record.setTimestamp(LocalDateTime.now());
                record.setStatus(status);
                record.setRemarks(remarks);
                record.setCapturedImagePath(imagePath);

                return recordRepository.save(record);
        }

        public com.college.smartattendance.dto.StudentAnalyticsDto getStudentAnalytics(Long studentId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                List<AttendanceRecord> records = recordRepository.findByStudent(student);
                long totalPresent = records.stream()
                                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                                || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                                .count();
                long totalSessions = records.size(); // Use total sessions logic later for global count

                // This simplistic logic assumes records exist only for attended sessions.
                // Real-world: Need to count total sessions conducted for the student's class.
                // For MVP, we will count 'Present' vs 'Total Records' (which includes
                // Rejected/Pending).
                // A better approach is to query all sessions for the class.

                // Get Student's Class ID
                // Simplified: Assuming 1 class per student for now
                // Extend: Find all sessions for student's mapped class

                double percentage = totalSessions == 0 ? 0 : ((double) totalPresent / totalSessions) * 100;

                com.college.smartattendance.dto.StudentAnalyticsDto dto = new com.college.smartattendance.dto.StudentAnalyticsDto();
                dto.setTotalSessions(totalSessions);
                dto.setPresentCount(totalPresent);
                dto.setPercentage(percentage);
                dto.setAttendanceStatus(percentage >= 75 ? "Eligible" : "Low Attendance");

                return dto;
        }

        // Haversine formula
        private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
                if (lat1 == 0 || lat2 == 0)
                        return 0;
                final int R = 6371; // Radius of the earth
                double latDistance = Math.toRadians(lat2 - lat1);
                double lonDistance = Math.toRadians(lon2 - lon1);
                double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                                                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
                double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                double distance = R * c * 1000; // convert to meters
                return distance;
        }

        public List<Subject> getStudentSubjects(Long studentId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                // Get all attendance records for this student
                List<AttendanceRecord> records = recordRepository.findByStudent(student);

                // Extract unique subjects from sessions
                return records.stream()
                                .map(record -> record.getSession().getFacultySubjectMap().getSubject())
                                .distinct()
                                .collect(java.util.stream.Collectors.toList());
        }

        public com.college.smartattendance.dto.SubjectAttendanceDto getSubjectAttendance(Long studentId,
                        Long subjectId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                // Get all attendance records for this student
                List<AttendanceRecord> records = recordRepository.findByStudent(student);

                // Filter records for the specific subject
                List<AttendanceRecord> subjectRecords = records.stream()
                                .filter(record -> record.getSession().getFacultySubjectMap().getSubject().getId()
                                                .equals(subjectId))
                                .collect(java.util.stream.Collectors.toList());

                long totalSessions = subjectRecords.size();
                long presentCount = subjectRecords.stream()
                                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                                || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                                .count();

                double percentage = totalSessions == 0 ? 0 : ((double) presentCount / totalSessions) * 100;

                com.college.smartattendance.dto.SubjectAttendanceDto dto = new com.college.smartattendance.dto.SubjectAttendanceDto();
                dto.setSubjectId(subjectId);

                // Get subject name
                if (!subjectRecords.isEmpty()) {
                        dto.setSubjectName(subjectRecords.get(0).getSession().getFacultySubjectMap().getSubject()
                                        .getName());
                }

                dto.setTotalSessions(totalSessions);
                dto.setPresentCount(presentCount);
                dto.setPercentage(percentage);

                return dto;
        }

        public com.college.smartattendance.dto.AttendanceStatusDto getAttendanceStatus(Long studentId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                List<AttendanceRecord> records = recordRepository.findByStudent(student);
                long totalSessions = records.size();
                long presentCount = records.stream()
                                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT
                                                || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                                .count();

                double currentPercentage = totalSessions == 0 ? 0 : ((double) presentCount / totalSessions) * 100;
                double requiredPercentage = 75.0;

                // Calculate classes needed to reach 75%
                int classesNeeded = 0;
                if (currentPercentage < requiredPercentage) {
                        classesNeeded = (int) Math.ceil((requiredPercentage * totalSessions - presentCount * 100)
                                        / (100 - requiredPercentage));
                        classesNeeded = Math.max(0, classesNeeded);
                }

                com.college.smartattendance.dto.AttendanceStatusDto dto = new com.college.smartattendance.dto.AttendanceStatusDto();
                dto.setStatus(currentPercentage >= requiredPercentage ? "Eligible" : "Shortage");
                dto.setCurrentPercentage(currentPercentage);
                dto.setRequiredPercentage(requiredPercentage);
                dto.setClassesNeededForEligibility(classesNeeded);
                dto.setTotalPresent((int) presentCount);
                dto.setTotalSessions((int) totalSessions);

                return dto;
        }

        public List<com.college.smartattendance.dto.TodaySessionDto> getTodaySessions(Long studentId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                java.time.LocalDate today = java.time.LocalDate.now();
                List<AttendanceSession> allSessions = sessionRepository.findAll();

                return allSessions.stream()
                                .filter(session -> session.getStartTime().toLocalDate().equals(today))
                                .map(session -> {
                                        com.college.smartattendance.dto.TodaySessionDto dto = new com.college.smartattendance.dto.TodaySessionDto();
                                        dto.setSessionId(session.getId());
                                        dto.setSubjectName(session.getFacultySubjectMap().getSubject().getName());
                                        User facultyUser = session.getFacultySubjectMap().getFaculty().getUser();
                                        String fullName = (facultyUser.getFirstName() != null
                                                        ? facultyUser.getFirstName()
                                                        : "") +
                                                        " "
                                                        + (facultyUser.getLastName() != null ? facultyUser.getLastName()
                                                                        : "");
                                        dto.setFacultyName(fullName.trim());
                                        dto.setStartTime(session.getStartTime());
                                        dto.setEndTime(session.getEndTime());

                                        java.time.LocalDateTime now = java.time.LocalDateTime.now();
                                        if (now.isBefore(session.getStartTime())) {
                                                dto.setStatus("Upcoming");
                                        } else if (now.isAfter(session.getEndTime())) {
                                                dto.setStatus("Closed");
                                        } else {
                                                dto.setStatus("Open");
                                        }

                                        boolean hasMarked = recordRepository.findBySessionAndStudent(session, student)
                                                        .isPresent();
                                        dto.setHasMarkedAttendance(hasMarked);

                                        return dto;
                                })
                                .collect(java.util.stream.Collectors.toList());
        }

        public List<com.college.smartattendance.dto.AttendanceHistoryDto> getAttendanceHistory(Long studentId,
                        int limit) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                List<AttendanceRecord> records = recordRepository.findByStudent(student);

                return records.stream()
                                .sorted((r1, r2) -> r2.getTimestamp().compareTo(r1.getTimestamp()))
                                .limit(limit)
                                .map(record -> {
                                        com.college.smartattendance.dto.AttendanceHistoryDto dto = new com.college.smartattendance.dto.AttendanceHistoryDto();
                                        dto.setDate(record.getTimestamp());
                                        dto.setSubjectName(record.getSession().getFacultySubjectMap().getSubject()
                                                        .getName());

                                        switch (record.getStatus()) {
                                                case PRESENT:
                                                        dto.setStatus("Present");
                                                        break;
                                                case MANUAL_VERIFIED:
                                                        dto.setStatus("Present");
                                                        dto.setRemarks("Manual Override");
                                                        break;
                                                case PENDING_VERIFICATION:
                                                        dto.setStatus("Pending");
                                                        break;
                                                case REJECTED:
                                                        dto.setStatus("Absent");
                                                        break;
                                                default:
                                                        dto.setStatus("Unknown");
                                        }

                                        return dto;
                                })
                                .collect(java.util.stream.Collectors.toList());
        }

        public List<String> getStudentAlerts(Long studentId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                List<String> alerts = new java.util.ArrayList<>();

                com.college.smartattendance.dto.AttendanceStatusDto status = getAttendanceStatus(studentId);
                if (status.getCurrentPercentage() < 75) {
                        alerts.add("⚠️ Your overall attendance is below 75% (" +
                                        String.format("%.1f", status.getCurrentPercentage()) + "%)");
                }

                List<Subject> subjects = getStudentSubjects(studentId);
                for (Subject subject : subjects) {
                        com.college.smartattendance.dto.SubjectAttendanceDto subjectDto = getSubjectAttendance(
                                        studentId, subject.getId());
                        if (subjectDto.getPercentage() < 65) {
                                alerts.add("🔴 Low attendance in " + subject.getName() +
                                                " (" + String.format("%.1f", subjectDto.getPercentage()) + "%)");
                        }
                }

                java.time.LocalDate yesterday = java.time.LocalDate.now().minusDays(1);
                List<AttendanceSession> yesterdaySessions = sessionRepository.findAll().stream()
                                .filter(s -> s.getStartTime().toLocalDate().equals(yesterday))
                                .collect(java.util.stream.Collectors.toList());

                for (AttendanceSession session : yesterdaySessions) {
                        boolean marked = recordRepository.findBySessionAndStudent(session, student).isPresent();
                        if (!marked) {
                                alerts.add("⚠️ You missed attendance for " +
                                                session.getFacultySubjectMap().getSubject().getName() + " yesterday");
                        }
                }

                return alerts;
        }
}
