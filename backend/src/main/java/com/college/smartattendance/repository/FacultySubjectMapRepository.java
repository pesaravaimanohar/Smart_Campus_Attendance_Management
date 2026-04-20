package com.college.smartattendance.repository;

import com.college.smartattendance.entity.Faculty;
import com.college.smartattendance.entity.FacultySubjectMap;
import com.college.smartattendance.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FacultySubjectMapRepository extends JpaRepository<FacultySubjectMap, Long> {
    List<FacultySubjectMap> findByFacultyAndAcademicYear(Faculty faculty, AcademicYear academicYear);
    List<FacultySubjectMap> findByFaculty(Faculty faculty);
    List<FacultySubjectMap> findByFaculty_Id(Long facultyId);
    List<FacultySubjectMap> findBySubject_Id(Long subjectId);
    List<FacultySubjectMap> findBySubject_IdAndSection(Long subjectId, String section);
    List<FacultySubjectMap> findByAcademicYear(AcademicYear academicYear);
}
