package com.college.smartattendance.service;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class PromotionEngineService {

    @Autowired private StudentRepository studentRepository;
    @Autowired private StudentSemesterHistoryRepository semesterHistoryRepository;
    @Autowired private AcademicYearRepository academicYearRepository;
    @Autowired private AuditService auditService;

    public enum PromotionRule { PASS, BACKLOG, DETAINED }

    public static class PromotionResult {
        private int totalStudents;
        private int promoted;
        private int conditionalPromoted;
        private int detained;
        private List<String> errors = new ArrayList<>();

        public int getTotalStudents() { return totalStudents; }
        public void setTotalStudents(int v) { this.totalStudents = v; }
        public int getPromoted() { return promoted; }
        public void setPromoted(int v) { this.promoted = v; }
        public int getConditionalPromoted() { return conditionalPromoted; }
        public void setConditionalPromoted(int v) { this.conditionalPromoted = v; }
        public int getDetained() { return detained; }
        public void setDetained(int v) { this.detained = v; }
        public List<String> getErrors() { return errors; }
        public void setErrors(List<String> v) { this.errors = v; }
    }

    @Transactional(rollbackFor = Exception.class)
    public PromotionResult bulkPromoteStudents(
            String departmentCode,
            Integer currentSemester,
            String academicYearName,
            Map<String, Map<String, Object>> promotionData,
            Long promotedBy) {

        PromotionResult result = new PromotionResult();

        // Resolve AcademicYear entity
        AcademicYear academicYear = academicYearRepository.findByName(academicYearName)
                .orElseGet(() -> {
                    AcademicYear ay = new AcademicYear();
                    ay.setName(academicYearName);
                    return academicYearRepository.save(ay);
                });

        List<Student> students = studentRepository.findByDepartmentAndCurrentSemester(
                departmentCode, currentSemester);
        result.setTotalStudents(students.size());

        for (Student student : students) {
            String rollNumber = student.getRollNumber();
            if (!promotionData.containsKey(rollNumber)) {
                result.getErrors().add("No promotion data for: " + rollNumber);
                continue;
            }

            Map<String, Object> data = promotionData.get(rollNumber);
            boolean passed = (Boolean) data.getOrDefault("passed", false);
            int backlogs = (Integer) data.getOrDefault("backlogs", 0);

            PromotionStatus status;
            String remarks;

            if (passed) {
                status = PromotionStatus.PROMOTED;
                remarks = "Promoted - All subjects passed";
                result.setPromoted(result.getPromoted() + 1);
            } else if (backlogs > 0 && backlogs <= 3) {
                status = PromotionStatus.CONDITIONAL;
                remarks = "Conditional promotion - " + backlogs + " backlog(s)";
                result.setConditionalPromoted(result.getConditionalPromoted() + 1);
            } else {
                status = PromotionStatus.DETAINED;
                remarks = "Detained - " + backlogs + " backlog(s)";
                result.setDetained(result.getDetained() + 1);
            }

            StudentSemesterHistory history = new StudentSemesterHistory();
            history.setStudent(student);
            history.setSemesterNumber(currentSemester);
            history.setAcademicYear(academicYear);
            history.setStatus(status);
            history.setRemarks(remarks);
            semesterHistoryRepository.save(history);

            Integer oldSemester = student.getCurrentSemester();
            if (status == PromotionStatus.PROMOTED || status == PromotionStatus.CONDITIONAL) {
                student.setCurrentSemester(currentSemester + 1);
                studentRepository.save(student);
            }

            auditService.logAction(promotedBy, "Student", student.getId(), "PROMOTION",
                    "Semester " + oldSemester,
                    status + " to Semester " + student.getCurrentSemester() + " - " + remarks, null);
        }

        return result;
    }

    @Transactional(rollbackFor = Exception.class)
    public int reversePromotion(String departmentCode, Integer semester,
            String academicYearName, Long reversedBy) {

        AcademicYear academicYear = academicYearRepository.findByName(academicYearName)
                .orElseThrow(() -> new RuntimeException("Academic year not found: " + academicYearName));

        List<StudentSemesterHistory> histories = semesterHistoryRepository
                .findBySemesterNumberAndAcademicYear(semester, academicYear);

        int count = 0;
        for (StudentSemesterHistory history : histories) {
            Student student = history.getStudent();
            if (!departmentCode.equals(student.getDepartment())) continue;

            if (history.getStatus() == PromotionStatus.PROMOTED ||
                    history.getStatus() == PromotionStatus.CONDITIONAL) {
                Integer currentSem = student.getCurrentSemester();
                student.setCurrentSemester(semester);
                studentRepository.save(student);
                auditService.logAction(reversedBy, "Student", student.getId(), "PROMOTION_REVERSED",
                        "Semester " + currentSem, "Reverted to Semester " + semester, null);
                count++;
            }

            history.setRemarks((history.getRemarks() != null ? history.getRemarks() : "") + " [REVERSED]");
            semesterHistoryRepository.save(history);
        }
        return count;
    }

    public List<Student> getPromotionEligibleStudents(String departmentCode, Integer semester) {
        return studentRepository.findByDepartmentAndCurrentSemester(departmentCode, semester);
    }

    public List<StudentSemesterHistory> getStudentPromotionHistory(Long studentId) {
        return semesterHistoryRepository.findByStudentIdOrderBySemesterAsc(studentId);
    }

    public Map<String, Object> getPromotionStatistics(String departmentCode, String academicYearName) {
        AcademicYear academicYear = academicYearRepository.findByName(academicYearName).orElse(null);
        if (academicYear == null) return Map.of("error", "Academic year not found");

        List<StudentSemesterHistory> histories = semesterHistoryRepository.findByAcademicYear(academicYear);

        int promoted = 0, conditional = 0, detained = 0;
        for (StudentSemesterHistory history : histories) {
            if (!departmentCode.equals(history.getStudent().getDepartment())) continue;
            switch (history.getStatus()) {
                case PROMOTED: promoted++; break;
                case CONDITIONAL: conditional++; break;
                case DETAINED: detained++; break;
                default: break;
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("promoted", promoted);
        stats.put("conditional", conditional);
        stats.put("detained", detained);
        stats.put("total", promoted + conditional + detained);
        int total = promoted + conditional + detained;
        stats.put("promotionRate", total > 0 ? (double) promoted / total * 100 : 0.0);
        return stats;
    }
}
