package com.college.smartattendance.repository;

import com.college.smartattendance.entity.AcademicYear;
import com.college.smartattendance.entity.StudentSemesterHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentSemesterHistoryRepository extends JpaRepository<StudentSemesterHistory, Long> {
    List<StudentSemesterHistory> findByStudent_IdOrderBySemesterNumberDesc(Long studentId);
    List<StudentSemesterHistory> findByAcademicYearId(Long academicYearId);
    List<StudentSemesterHistory> findByAcademicYear(AcademicYear academicYear);
    List<StudentSemesterHistory> findBySemesterNumberAndAcademicYear(Integer semester, AcademicYear academicYear);

    // alias for service
    default List<StudentSemesterHistory> findByStudentIdOrderBySemesterAsc(Long studentId) {
        var list = findByStudent_IdOrderBySemesterNumberDesc(studentId);
        list.sort(java.util.Comparator.comparing(StudentSemesterHistory::getSemesterNumber));
        return list;
    }
}
