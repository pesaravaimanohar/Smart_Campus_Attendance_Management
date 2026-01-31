package com.college.smartattendance.repository;

import com.college.smartattendance.entity.CourseClass;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseClassRepository extends JpaRepository<CourseClass, Long> {
}
