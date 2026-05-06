package com.college.smartattendance.repository;

import com.college.smartattendance.entity.CourseClass;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseClassRepository extends JpaRepository<CourseClass, Long> {
    List<CourseClass> findByCrc_Id(Long crcFacultyId);
    List<CourseClass> findByDepartment(String department);
}
