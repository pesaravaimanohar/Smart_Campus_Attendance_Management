package com.college.smartattendance.repository;

import com.college.smartattendance.entity.LabFacultyAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LabFacultyAssignmentRepository extends JpaRepository<LabFacultyAssignment, Long> {

    List<LabFacultyAssignment> findByLabSubject_IdAndCourseClass_Id(Long subjectId, Long classId);

    List<LabFacultyAssignment> findByFaculty_Id(Long facultyId);

    boolean existsByLabSubject_IdAndFaculty_IdAndCourseClass_IdAndActive(Long subjectId, Long facultyId, Long classId, Boolean active);
    
    boolean existsByLabSubject_IdAndFaculty_IdAndCourseClass_Id(Long subjectId, Long facultyId, Long classId);

    boolean existsByLabSubject_IdAndFaculty_IdAndCourseClass_IdAndActiveTrue(Long subjectId, Long facultyId, Long classId);

    long countByLabSubject_IdAndCourseClass_Id(Long subjectId, Long classId);

    @Query("SELECT lfa FROM LabFacultyAssignment lfa WHERE lfa.labSubject.id = :subjectId " +
           "AND lfa.courseClass.id = :classId AND lfa.active = true")
    List<LabFacultyAssignment> findActiveAssignmentsByLabAndClass(@Param("subjectId") Long subjectId,
                                                                   @Param("classId") Long classId);

    @Query("SELECT lfa FROM LabFacultyAssignment lfa WHERE lfa.faculty.id = :facultyId AND lfa.active = true")
    List<LabFacultyAssignment> findActiveLabs(@Param("facultyId") Long facultyId);

    List<LabFacultyAssignment> findByCourseClass_IdAndActiveTrue(Long classId);
}
