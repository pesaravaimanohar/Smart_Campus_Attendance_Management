package com.college.smartattendance.repository;

import com.college.smartattendance.entity.StudentClassMap;
import com.college.smartattendance.entity.Student;
import com.college.smartattendance.entity.CourseClass;
import com.college.smartattendance.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentClassMapRepository extends JpaRepository<StudentClassMap, Long> {
    Optional<StudentClassMap> findByStudentAndAcademicYear(Student student, AcademicYear academicYear);
    boolean existsByStudent_IdAndCourseClass_Id(Long studentId, Long classId);
    List<StudentClassMap> findByStudent_Id(Long studentId);
    List<StudentClassMap> findByCourseClass_Id(Long classId);
    List<StudentClassMap> findByCourseClass_IdAndAcademicYear_Id(Long classId, Long academicYearId);
    long countByCourseClass_Id(Long classId);

    @Query("SELECT scm FROM StudentClassMap scm WHERE scm.student.departmentEntity.id = :deptId AND scm.student.currentSemester = :semester")
    List<StudentClassMap> findByDepartmentAndSemester(@Param("deptId") Long departmentId, @Param("semester") Integer semester);
}

