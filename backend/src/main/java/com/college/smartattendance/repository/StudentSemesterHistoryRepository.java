package com.college.smartattendance.repository;

import com.college.smartattendance.entity.StudentSemesterHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentSemesterHistoryRepository extends JpaRepository<StudentSemesterHistory, Long> {
    List<StudentSemesterHistory> findByStudentIdOrderBySemesterNumberDesc(Long studentId);

    List<StudentSemesterHistory> findByAcademicYearId(Long academicYearId);
}
