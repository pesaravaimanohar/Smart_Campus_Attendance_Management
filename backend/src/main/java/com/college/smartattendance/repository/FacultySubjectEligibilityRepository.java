package com.college.smartattendance.repository;

import com.college.smartattendance.entity.Faculty;
import com.college.smartattendance.entity.FacultySubjectEligibility;
import com.college.smartattendance.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacultySubjectEligibilityRepository extends JpaRepository<FacultySubjectEligibility, Long> {
    List<FacultySubjectEligibility> findByFacultyIdAndActiveTrue(Long facultyId);

    List<FacultySubjectEligibility> findBySubjectIdAndActiveTrue(Long subjectId);

    Optional<FacultySubjectEligibility> findByFacultyAndSubjectAndActiveTrue(Faculty faculty, Subject subject);

    boolean existsByFacultyIdAndSubjectIdAndActiveTrue(Long facultyId, Long subjectId);
}
