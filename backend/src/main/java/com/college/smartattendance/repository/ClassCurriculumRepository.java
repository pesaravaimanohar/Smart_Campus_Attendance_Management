package com.college.smartattendance.repository;

import com.college.smartattendance.entity.ClassCurriculum;
import com.college.smartattendance.entity.ProgramType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassCurriculumRepository extends JpaRepository<ClassCurriculum, Long> {

    List<ClassCurriculum> findAllByOrderByDepartmentCodeAscProgramAscSemesterAscSectionKeyAsc();

    Optional<ClassCurriculum> findByDepartmentCodeAndProgramAndSemesterAndSectionKey(
            String departmentCode, ProgramType program, int semester, String sectionKey);
}
