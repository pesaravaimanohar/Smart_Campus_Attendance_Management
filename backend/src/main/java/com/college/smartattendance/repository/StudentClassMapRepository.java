package com.college.smartattendance.repository;

import com.college.smartattendance.entity.StudentClassMap;
import com.college.smartattendance.entity.Student;
import com.college.smartattendance.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StudentClassMapRepository extends JpaRepository<StudentClassMap, Long> {
    Optional<StudentClassMap> findByStudentAndAcademicYear(Student student, AcademicYear academicYear);
}
