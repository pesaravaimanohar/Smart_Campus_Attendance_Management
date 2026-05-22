package com.college.smartattendance.service;

import com.college.smartattendance.dto.SessionInfoDto;
import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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

        @Autowired
        private FacultyRepository facultyRepository;

        @Autowired
        private StudentClassMapRepository studentClassMapRepository;

        @Autowired
        private SubjectRepository subjectRepository;

        @Autowired
        private LabFacultyAssignmentRepository labFacultyAssignmentRepository;

        @Autowired
        private LabAssignmentService labAssignmentService;

        @Autowired
        private StudentAlertRepository studentAlertRepository;

        @Transactional
        public AttendanceSession createSession(Long facultySubjectMapId, Double lat, Double lon,
                        Integer durationMinutes,
                        Double radius, String period, Integer numberOfHours) {
                FacultySubjectMap map = facultySubjectMapRepository.findById(facultySubjectMapId)
                                .orElseThrow(() -> new RuntimeException("Mapping not found"));

                if (numberOfHours == null || numberOfHours < 1) numberOfHours = 1;
                if (numberOfHours > 3) numberOfHours = 3;

                // Overlap check
                Long classId = map.getCourseClass().getId();
                validatePeriodOverlap(classId, period, numberOfHours);

                // Deactivate any existing active sessions for this mapping (redundant but safe)
                List<AttendanceSession> activeSessions = sessionRepository.findByFacultySubjectMap_Id(facultySubjectMapId);
                for (AttendanceSession s : activeSessions) {
                        if (s.isActive()) {
                                s.setActive(false);
                                s.setEndTime(LocalDateTime.now());
                                sessionRepository.save(s);
                        }
                }

                AttendanceSession session = new AttendanceSession();
                session.setFacultySubjectMap(map);
                session.setCourseClass(map.getCourseClass());
                session.setStartTime(LocalDateTime.now());
                session.setEndTime(LocalDateTime.now().plusMinutes(durationMinutes));
                session.setActive(true);
                session.setLatitude(lat);
                session.setLongitude(lon);
                session.setRadius(radius != null ? radius : 50.0);
                session.setQrToken(UUID.randomUUID().toString());
                session.setPeriod(period);
                session.setNumberOfHours(numberOfHours);

                return sessionRepository.save(session);
        }

        private void validatePeriodOverlap(Long classId, String periodStr, Integer hours) {
            int startPeriod;
            try {
                startPeriod = Integer.parseInt(periodStr);
            } catch (Exception e) {
                return; // Not a numeric period, skip validation for now (e.g. special sessions)
            }

            java.util.Set<Integer> requestedPeriods = new java.util.HashSet<>();
            for (int i = 0; i < hours; i++) {
                requestedPeriods.add(startPeriod + i);
            }

            List<AttendanceSession> todaySessions = sessionRepository.findSessionsByClassForToday(classId);
            for (AttendanceSession s : todaySessions) {
                try {
                    int sStart = Integer.parseInt(s.getPeriod());
                    int sHours = s.getNumberOfHours() != null ? s.getNumberOfHours() : 1;
                    for (int i = 0; i < sHours; i++) {
                        if (requestedPeriods.contains(sStart + i)) {
                            throw new RuntimeException("Period " + (sStart + i) + " is already taken by " + 
                                (s.getFacultySubjectMap() != null ? s.getFacultySubjectMap().getSubject().getName() : s.getLabSubject().getName()));
                        }
                    }
                } catch (Exception e) {
                    if (e instanceof RuntimeException) throw (RuntimeException) e;
                    // Ignore parsing errors for individual sessions
                }
            }
        }

        @Transactional
        public AttendanceSession refreshQrToken(Long sessionId) {
                AttendanceSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found"));

                if (!session.isActive()) {
                        throw new RuntimeException("Session is not active");
                }

                session.setQrToken(UUID.randomUUID().toString());
                return sessionRepository.save(session);
        }

        @Transactional
        public AttendanceSession endSession(Long sessionId) {
                AttendanceSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found"));

                if (Boolean.TRUE.equals(session.getIsLabSession())) {
                        return endLabSession(sessionId);
                }

                session.setActive(false);
                session.setEndTime(LocalDateTime.now());
                session.setQrToken(null);
                
                // Mark absentees: find all students in this class and if no record exists, mark ABSENT
                FacultySubjectMap map = session.getFacultySubjectMap();
                CourseClass courseClass = map.getCourseClass();
                String section = map.getSection();

                List<StudentClassMap> classMaps = studentClassMapRepository.findByCourseClass_Id(courseClass.getId());
                for (StudentClassMap scm : classMaps) {
                        Student student = scm.getStudent();
                        
                        // If section is specified in session, only mark students in that section
                        if (section != null && !section.isEmpty()) {
                                if (!section.equalsIgnoreCase(student.getSection())) {
                                        continue;
                                }
                        }

                        // Check if record exists
                        Optional<AttendanceRecord> existing = recordRepository.findBySessionAndStudent(session, student);
                        if (existing.isEmpty()) {
                                AttendanceRecord absentRecord = new AttendanceRecord();
                                absentRecord.setSession(session);
                                absentRecord.setStudent(student);
                                absentRecord.setTimestamp(LocalDateTime.now());
                                absentRecord.setStatus(AttendanceStatus.ABSENT);
                                absentRecord.setRemarks("System: Automatic Absent");
                                recordRepository.save(absentRecord);
                        }
                }

                return sessionRepository.save(session);
        }

        public SessionInfoDto getSessionInfoByQrToken(String qrToken) {
                AttendanceSession session = sessionRepository.findByQrToken(qrToken)
                                .orElseThrow(() -> new RuntimeException("Invalid QR code. Session not found."));

                if (!session.isActive() || LocalDateTime.now().isAfter(session.getEndTime())) {
                        throw new RuntimeException("This session has expired.");
                }

                FacultySubjectMap map = session.getFacultySubjectMap();
                User facultyUser = null;
                if (map != null) {
                        facultyUser = map.getFaculty().getUser();
                } else if (session.getCreatedByFacultyId() != null) {
                        facultyUser = facultyRepository.findById(session.getCreatedByFacultyId())
                                        .map(Faculty::getUser)
                                        .orElse(null);
                }

                SessionInfoDto dto = new SessionInfoDto();
                dto.setSessionId(session.getId());
                if (map != null) {
                        dto.setSubjectName(map.getSubject().getName());
                        dto.setSubjectCode(map.getSubject().getCode());
                        dto.setClassName(map.getCourseClass().getName());
                } else {
                        dto.setSubjectName(session.getLabSubject() != null ? session.getLabSubject().getName() : "Lab Session");
                        dto.setSubjectCode(session.getLabSubject() != null ? session.getLabSubject().getCode() : "LAB");
                        dto.setClassName(session.getCourseClass() != null ? session.getCourseClass().getName() : "N/A");
                }
                
                if (facultyUser != null) {
                        String fullName = (facultyUser.getFirstName() != null ? facultyUser.getFirstName() : "")
                                        + " " + (facultyUser.getLastName() != null ? facultyUser.getLastName() : "");
                        dto.setFacultyName(fullName.trim());
                } else {
                        dto.setFacultyName("Unknown Faculty");
                }
                dto.setStartTime(session.getStartTime());
                dto.setEndTime(session.getEndTime());
                dto.setActive(true);
                dto.setQrToken(session.getQrToken());
                dto.setAttendanceCount(recordRepository.findBySession(session).size());

                return dto;
        }

        @Transactional
        public AttendanceRecord validateAndMarkByQr(Long studentId, String qrToken, Double lat, Double lon) {
                // 1. Find session by QR token
                AttendanceSession session = sessionRepository.findByQrToken(qrToken)
                                .orElseThrow(() -> new RuntimeException("Invalid QR code. Please scan again."));

                // 2. Check session is active
                if (!session.isActive() || LocalDateTime.now().isAfter(session.getEndTime())) {
                        throw new RuntimeException("This attendance session has expired.");
                }

                // 3. Get student
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                // 4. Check if student belongs to this class
                FacultySubjectMap map = session.getFacultySubjectMap();
                CourseClass sessionClass = map != null ? map.getCourseClass() : session.getCourseClass();
                String section = map != null ? map.getSection() : null;

                boolean belongsToClass = checkStudentBelongsToClass(student, sessionClass, section);

                if (!belongsToClass) {
                        throw new RuntimeException("You are not enrolled in this class. Only " 
                                        + sessionClass.getName() + " students can mark attendance for this session.");
                }

                // 5. Check if already marked
                Optional<AttendanceRecord> existing = recordRepository.findBySessionAndStudent(session, student);
                if (existing.isPresent()) {
                        return existing.get(); // Already marked, return existing
                }

                // 6. Validate Location
                double distance = calculateDistance(lat, lon, session.getLatitude(), session.getLongitude());
                System.out.println("DEBUG: Student at [" + lat + "," + lon + "], Session at [" + session.getLatitude() + "," + session.getLongitude() + "]. Distance: " + distance + "m, Radius: " + session.getRadius() + "m");
                
                AttendanceStatus status = AttendanceStatus.PRESENT;
                String remarks = "QR Verified";

                if (distance > session.getRadius()) {
                        System.out.println("DEBUG: Distance rejection triggered.");
                        status = AttendanceStatus.REJECTED;
                        remarks = "Location Mismatch: " + String.format("%.2f", distance) + "m away (max: " + session.getRadius() + "m)";
                }

                // 7. Create attendance record
                AttendanceRecord record = new AttendanceRecord();
                record.setSession(session);
                record.setStudent(student);
                record.setTimestamp(LocalDateTime.now());
                record.setStatus(status);
                record.setRemarks(remarks);

                return recordRepository.save(record);
        }

        private boolean checkStudentBelongsToClass(Student student, CourseClass courseClass, String section) {
                // Check via StudentClassMap
                boolean inClassMap = studentClassMapRepository.existsByStudent_IdAndCourseClass_Id(
                                student.getId(), courseClass.getId());
                if (inClassMap) {
                        return true;
                }

                // Fallback: Check via department + semester + section matching
                String classDept = courseClass.getDepartment();
                String studentDept = student.getDepartment();
                if (studentDept == null && student.getDepartmentEntity() != null) {
                        studentDept = student.getDepartmentEntity().getCode() != null 
                                        ? student.getDepartmentEntity().getCode() 
                                        : student.getDepartmentEntity().getName();
                }

                // Match by department
                if (classDept != null && studentDept != null && classDept.equalsIgnoreCase(studentDept)) {
                        // Also match section if specified
                        if (section != null && !section.isEmpty()) {
                                return section.equalsIgnoreCase(student.getSection());
                        }
                        return true;
                }

                return false;
        }

        public int getSessionAttendanceCount(Long sessionId) {
                AttendanceSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found"));
                return (int) recordRepository.findBySession(session).stream()
                                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT || r.getStatus() == AttendanceStatus.MANUAL_VERIFIED)
                                .count();
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

                long[] stats = getStudentAttendanceStats(student, null);
                long totalSessions = stats[0];
                long totalPresent = stats[1];

                double percentage = totalSessions == 0 ? 0 : ((double) totalPresent / totalSessions) * 100;

                com.college.smartattendance.dto.StudentAnalyticsDto dto = new com.college.smartattendance.dto.StudentAnalyticsDto();
                dto.setTotalSessions(totalSessions);
                dto.setPresentCount(totalPresent);
                dto.setPercentage(percentage);
                dto.setAttendanceStatus(percentage >= 75 ? "Eligible" : "Low Attendance");

                return dto;
        }

        private long[] getStudentAttendanceStats(Student student, Long subjectId) {
                List<StudentClassMap> classMaps = studentClassMapRepository.findByStudent_Id(student.getId());
                long totalSessions = 0;
                long totalPresent = 0;

                for (StudentClassMap scm : classMaps) {
                        Long classId = scm.getCourseClass().getId();
                        List<AttendanceSession> sessions = sessionRepository.findByCourseClass_Id(classId);

                        for (AttendanceSession session : sessions) {
                                // Subject filter
                                Long sId = session.getFacultySubjectMap() != null ? session.getFacultySubjectMap().getSubject().getId()
                                                : (session.getLabSubject() != null ? session.getLabSubject().getId()
                                                                : null);
                                if (subjectId != null && (sId == null || !sId.equals(subjectId))) {
                                        continue;
                                }

                                // Section filter
                                if (session.getFacultySubjectMap() != null
                                                && session.getFacultySubjectMap().getSection() != null
                                                && !session.getFacultySubjectMap().getSection().isEmpty()) {
                                        if (!session.getFacultySubjectMap().getSection()
                                                        .equalsIgnoreCase(student.getSection())) {
                                                continue;
                                        }
                                }

                                int hours = session.getNumberOfHours() != null ? session.getNumberOfHours() : 1;
                                Optional<AttendanceRecord> rec = recordRepository.findBySessionAndStudent(session,
                                                student);

                                boolean isTrulyActive = session.isActive()
                                                && LocalDateTime.now().isBefore(session.getEndTime());

                                if (isTrulyActive) {
                                        // For active sessions, only count if student marked present
                                        if (rec.isPresent() && (rec.get().getStatus() == AttendanceStatus.PRESENT
                                                        || rec.get()
                                                                        .getStatus() == AttendanceStatus.MANUAL_VERIFIED)) {
                                                totalSessions += hours;
                                                totalPresent += hours;
                                        }
                                } else {
                                        // For ended or expired sessions, they always count towards total
                                        totalSessions += hours;
                                        if (rec.isPresent() && (rec.get().getStatus() == AttendanceStatus.PRESENT
                                                        || rec.get()
                                                                        .getStatus() == AttendanceStatus.MANUAL_VERIFIED)) {
                                                totalPresent += hours;
                                        }
                                }
                        }
                }
                return new long[] { totalSessions, totalPresent };
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

        public List<java.util.Map<String, Object>> getStudentSubjects(Long studentId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                // Get all subjects assigned to student's class
                List<StudentClassMap> classMaps = studentClassMapRepository.findByStudent_Id(student.getId());
                java.util.Map<Long, Subject> subjectMap = new java.util.HashMap<>();
                for (StudentClassMap scm : classMaps) {
                        Long classId = scm.getCourseClass().getId();
                        
                        // 1. Regular subjects
                        List<FacultySubjectMap> fsms = facultySubjectMapRepository.findByCourseClass_Id(classId);
                        for (FacultySubjectMap fsm : fsms) {
                                if (fsm.getSection() == null || fsm.getSection().isEmpty() || fsm.getSection().equalsIgnoreCase(student.getSection())) {
                                        subjectMap.put(fsm.getSubject().getId(), fsm.getSubject());
                                }
                        }

                        // 2. Lab assignments
                        List<LabFacultyAssignment> labs = labFacultyAssignmentRepository.findByCourseClass_IdAndActiveTrue(classId);
                        for (LabFacultyAssignment lab : labs) {
                                subjectMap.put(lab.getLabSubject().getId(), lab.getLabSubject());
                        }
                }

                java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
                for (Subject subject : subjectMap.values()) {
                        long[] stats = getStudentAttendanceStats(student, subject.getId());
                        long total = stats[0];
                        long attended = stats[1];
                        double pct = total == 0 ? 0 : Math.round(((double) attended / total) * 100.0 * 10) / 10.0;

                        java.util.Map<String, Object> item = new java.util.LinkedHashMap<>();
                        item.put("id", subject.getId());
                        item.put("name", subject.getName());
                        item.put("code", subject.getCode());
                        item.put("attended", attended);
                        item.put("total", total);
                        item.put("attendancePercentage", pct);
                        result.add(item);
                }

                // Sort by subject name
                result.sort((a, b) -> ((String) a.get("name")).compareTo((String) b.get("name")));
                return result;
        }


        public com.college.smartattendance.dto.SubjectAttendanceDto getSubjectAttendance(Long studentId,
                        Long subjectId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                long[] stats = getStudentAttendanceStats(student, subjectId);
                long totalSessions = stats[0];
                long presentCount = stats[1];

                double percentage = totalSessions == 0 ? 0 : ((double) presentCount / totalSessions) * 100;

                com.college.smartattendance.dto.SubjectAttendanceDto dto = new com.college.smartattendance.dto.SubjectAttendanceDto();
                dto.setSubjectId(subjectId);

                // Get subject name from database
                subjectRepository.findById(subjectId).ifPresent(s -> dto.setSubjectName(s.getName()));

                dto.setTotalSessions(totalSessions);
                dto.setPresentCount(presentCount);
                dto.setPercentage(percentage);

                return dto;
        }

        public com.college.smartattendance.dto.AttendanceStatusDto getAttendanceStatus(Long studentId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                long[] stats = getStudentAttendanceStats(student, null);
                long totalSessions = stats[0];
                long presentCount = stats[1];

                double currentPercentage = totalSessions == 0 ? 0 : ((double) presentCount / totalSessions) * 100;
                double requiredPercentage = 75.0;

                // Calculate classes needed to reach 75%
                int classesNeeded = 0;
                if (currentPercentage < requiredPercentage) {
                        // Formula: (P + x) / (T + x) = 0.75  => P + x = 0.75T + 0.75x => 0.25x = 0.75T - P => x = 3T - 4P
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
                                        
                                        FacultySubjectMap map = session.getFacultySubjectMap();
                                        User facultyUser = null;
                                        if (map != null) {
                                                dto.setSubjectName(map.getSubject().getName());
                                                facultyUser = map.getFaculty().getUser();
                                        } else {
                                                dto.setSubjectName(session.getLabSubject() != null ? session.getLabSubject().getName() : "Lab Session");
                                                if (session.getCreatedByFacultyId() != null) {
                                                        facultyUser = facultyRepository.findById(session.getCreatedByFacultyId())
                                                                        .map(Faculty::getUser)
                                                                        .orElse(null);
                                                }
                                        }

                                        if (facultyUser != null) {
                                                String fullName = (facultyUser.getFirstName() != null ? facultyUser.getFirstName() : "")
                                                                + " " + (facultyUser.getLastName() != null ? facultyUser.getLastName() : "");
                                                dto.setFacultyName(fullName.trim());
                                        } else {
                                                dto.setFacultyName("Unknown Faculty");
                                        }
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
                                        
                                        FacultySubjectMap map = record.getSession().getFacultySubjectMap();
                                        if (map != null) {
                                                dto.setSubjectName(map.getSubject().getName());
                                        } else {
                                                dto.setSubjectName(record.getSession().getLabSubject() != null ? record.getSession().getLabSubject().getName() : "Lab Session");
                                        }

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
                                                case ABSENT:
                                                        dto.setStatus("Absent");
                                                        break;
                                                default:
                                                        dto.setStatus("Unknown");
                                        }

                                        return dto;
                                })
                                .collect(java.util.stream.Collectors.toList());
        }

        @Transactional
        public List<com.college.smartattendance.dto.StudentAlertDto> getStudentAlerts(Long studentId) {
                Student student = studentRepository.findById(studentId)
                                .orElseThrow(() -> new RuntimeException("Student not found"));

                // 1. Generate current candidate alerts
                List<StudentAlert> candidates = new java.util.ArrayList<>();

                com.college.smartattendance.dto.AttendanceStatusDto status = getAttendanceStatus(studentId);
                if (status.getTotalSessions() > 0 && status.getCurrentPercentage() < 75) {
                    double pct = status.getCurrentPercentage();
                    String msg = "⚠️ Your overall attendance is below 75% (" + String.format("%.1f", pct) + "%)";
                    String key = "OVERALL_LOW:" + Math.round(pct);
                    
                    StudentAlert sa = new StudentAlert();
                    sa.setStudent(student);
                    sa.setAlertKey(key);
                    sa.setMessage(msg);
                    sa.setType("LOW_ATTENDANCE");
                    sa.setCreatedAt(LocalDateTime.now());
                    candidates.add(sa);
                }

                java.util.List<java.util.Map<String, Object>> subjects = getStudentSubjects(studentId);
                for (java.util.Map<String, Object> subject : subjects) {
                        Long subjectId = (Long) subject.get("id");
                        long total = ((Number) subject.get("total")).longValue();
                        double pct = ((Number) subject.get("attendancePercentage")).doubleValue();
                        
                        if (total > 0 && pct < 65) {
                            String msg = "🔴 Low attendance in " + subject.get("name") + " (" + String.format("%.1f", pct) + "%)";
                            String key = "SUBJECT_LOW:" + subjectId + ":" + Math.round(pct);
                            
                            StudentAlert sa = new StudentAlert();
                            sa.setStudent(student);
                            sa.setAlertKey(key);
                            sa.setMessage(msg);
                            sa.setType("LOW_ATTENDANCE");
                            sa.setCreatedAt(LocalDateTime.now());
                            candidates.add(sa);
                        }
                }

                java.time.LocalDate yesterday = java.time.LocalDate.now().minusDays(1);
                List<AttendanceSession> yesterdaySessions = sessionRepository.findAll().stream()
                                .filter(s -> s.getStartTime().toLocalDate().equals(yesterday))
                                .collect(java.util.stream.Collectors.toList());

                for (AttendanceSession session : yesterdaySessions) {
                        boolean marked = recordRepository.findBySessionAndStudent(session, student).isPresent();
                        if (!marked) {
                             String subName = session.getFacultySubjectMap() != null ? session.getFacultySubjectMap().getSubject().getName()
                                                    : (session.getLabSubject() != null ? session.getLabSubject().getName() : "Lab");
                            String msg = "⚠️ You missed attendance for " + subName + " yesterday";
                            String key = "MISSED_SESSION:" + session.getId();
                            
                            StudentAlert sa = new StudentAlert();
                            sa.setStudent(student);
                            sa.setAlertKey(key);
                            sa.setMessage(msg);
                            sa.setType("MISSED_SESSION");
                            sa.setCreatedAt(LocalDateTime.now());
                            candidates.add(sa);
                        }
                }

                // 2. Sync with DB
                for (StudentAlert candidate : candidates) {
                    Optional<StudentAlert> existing = studentAlertRepository.findByStudent_IdAndAlertKey(studentId, candidate.getAlertKey());
                    if (existing.isEmpty()) {
                        studentAlertRepository.save(candidate);
                    }
                }

                // 3. Return unread alerts
                return studentAlertRepository.findByStudent_IdAndIsReadFalse(studentId).stream()
                        .map(sa -> new com.college.smartattendance.dto.StudentAlertDto(
                            sa.getId(), sa.getAlertKey(), sa.getMessage(), sa.getType(), sa.getCreatedAt()
                        ))
                        .collect(java.util.stream.Collectors.toList());
        }

        @Transactional
        public void markAlertAsRead(Long alertId) {
            StudentAlert alert = studentAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
            alert.setRead(true);
            studentAlertRepository.save(alert);
        }

        /**
         * Create an attendance session for a lab (multi-faculty)
         */
        @Transactional
        public AttendanceSession createLabSession(Long labSubjectId, Long classId, Long createdByFacultyId,
                                                  Double lat, Double lon, Integer durationMinutes, Double radius, String period, Integer numberOfHours) {
                // Verify the subject is of type LAB
                Subject labSubject = subjectRepository.findById(labSubjectId)
                                .orElseThrow(() -> new RuntimeException("Lab subject not found"));

                if (!SubjectType.LAB.equals(labSubject.getSubjectType())) {
                        throw new RuntimeException("Subject is not of type LAB");
                }

                if (numberOfHours == null || numberOfHours < 1) numberOfHours = 1;
                if (numberOfHours > 3) numberOfHours = 3;

                // Overlap check
                validatePeriodOverlap(classId, period, numberOfHours);

                // Verify faculty is assigned to this lab
                boolean isFacultyAssigned = labAssignmentService.isFacultyAssignedToLab(createdByFacultyId, labSubjectId, classId);
                if (!isFacultyAssigned) {
                        throw new RuntimeException("Faculty is not assigned to this lab");
                }

                // Deactivate any existing active sessions for this lab
                List<AttendanceSession> activeSessions = sessionRepository.findAll().stream()
                                .filter(s -> s.getIsLabSession() && s.getLabSubject().getId().equals(labSubjectId)
                                        && s.isActive() && LocalDateTime.now().isBefore(s.getEndTime()))
                                .collect(java.util.stream.Collectors.toList());

                for (AttendanceSession s : activeSessions) {
                        s.setActive(false);
                        s.setEndTime(LocalDateTime.now());
                        sessionRepository.save(s);
                }

                AttendanceSession session = new AttendanceSession();
                session.setLabSubject(labSubject);
                session.setIsLabSession(true);
                session.setCreatedByFacultyId(createdByFacultyId);
                
                // Set CourseClass for easier lookup
                CourseClass courseClass = new CourseClass();
                courseClass.setId(classId);
                session.setCourseClass(courseClass);

                session.setStartTime(LocalDateTime.now());
                session.setEndTime(LocalDateTime.now().plusMinutes(durationMinutes));
                session.setActive(true);
                session.setLatitude(lat);
                session.setLongitude(lon);
                session.setRadius(radius != null ? radius : 50.0);
                session.setQrToken(UUID.randomUUID().toString());
                session.setPeriod(period);
                session.setNumberOfHours(numberOfHours);

                return sessionRepository.save(session);
        }

        /**
         * End a lab session and mark absentees
         */
        @Transactional
        public AttendanceSession endLabSession(Long sessionId) {
                AttendanceSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found"));

                if (!session.getIsLabSession()) {
                        throw new RuntimeException("This is not a lab session");
                }

                session.setActive(false);
                session.setEndTime(LocalDateTime.now());
                session.setQrToken(null);

                // Get the lab subject and find all students enrolled in the corresponding class
                Subject labSubject = session.getLabSubject();

                // For lab sessions, we need to find students based on the lab's subject assignment
                // Find lab faculty assignment to get the course class
                List<LabFacultyAssignment> assignments = labAssignmentService.getLabFaculty(labSubject.getId(), 0L);
                if (!assignments.isEmpty()) {
                        CourseClass courseClass = assignments.get(0).getCourseClass();
                        List<StudentClassMap> classMaps = studentClassMapRepository.findByCourseClass_Id(courseClass.getId());

                        for (StudentClassMap scm : classMaps) {
                                Student student = scm.getStudent();

                                Optional<AttendanceRecord> existing = recordRepository.findBySessionAndStudent(session, student);
                                if (existing.isEmpty()) {
                                        AttendanceRecord absentRecord = new AttendanceRecord();
                                        absentRecord.setSession(session);
                                        absentRecord.setStudent(student);
                                        absentRecord.setTimestamp(LocalDateTime.now());
                                        absentRecord.setStatus(AttendanceStatus.ABSENT);
                                        absentRecord.setRemarks("System: Lab - Automatic Absent");
                                        recordRepository.save(absentRecord);
                                }
                        }
                }

                return sessionRepository.save(session);
        }

        /**
         * Cancel a session — deactivates the session and removes all attendance records.
         * Unlike endSession, this does NOT mark absentees. The session is treated as if it never happened.
         */
        @Transactional
        public void cancelSession(Long sessionId) {
                AttendanceSession session = sessionRepository.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found"));

                // Delete all attendance records for this session
                List<AttendanceRecord> records = recordRepository.findBySession(session);
                recordRepository.deleteAll(records);

                // Delete the session itself
                sessionRepository.delete(session);
        }
}
