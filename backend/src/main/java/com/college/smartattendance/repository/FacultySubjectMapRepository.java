package com.college.smartattendance.repository;

import com.college.smartattendance.entity.FacultySubjectMap;
import com.college.smartattendance.entity.Faculty;
import com.college.smartattendance.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FacultySubjectMapRepository extends JpaRepository<FacultySubjectMap, Long> {
    List<FacultySubjectMap> findByFacultyAndAcademicYear(Faculty faculty, AcademicYear academicYear);
}
