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

    List<FacultySubjectEligibility> findByFaculty_IdAndActiveTrue(Long facultyId);
    List<FacultySubjectEligibility> findBySubject_IdAndActiveTrue(Long subjectId);
    Optional<FacultySubjectEligibility> findByFacultyAndSubjectAndActiveTrue(Faculty faculty, Subject subject);
    boolean existsByFaculty_IdAndSubject_IdAndActiveTrue(Long facultyId, Long subjectId);

    // aliases used by SubjectEligibilityService / SubjectAssignmentService
    default boolean existsByFacultyIdAndSubjectId(Long fId, Long sId) {
        return existsByFaculty_IdAndSubject_IdAndActiveTrue(fId, sId);
    }
    default List<FacultySubjectEligibility> findByFacultyId(Long facultyId) {
        return findByFaculty_IdAndActiveTrue(facultyId);
    }
    default List<FacultySubjectEligibility> findBySubjectId(Long subjectId) {
        return findBySubject_IdAndActiveTrue(subjectId);
    }
}
