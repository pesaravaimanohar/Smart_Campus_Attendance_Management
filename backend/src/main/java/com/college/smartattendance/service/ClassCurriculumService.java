package com.college.smartattendance.service;

import com.college.smartattendance.dto.ClassCurriculumDto;
import com.college.smartattendance.entity.ClassCurriculum;
import com.college.smartattendance.entity.ProgramType;
import com.college.smartattendance.entity.Student;
import com.college.smartattendance.repository.ClassCurriculumRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ClassCurriculumService {

    @Autowired
    private ClassCurriculumRepository classCurriculumRepository;

    public List<ClassCurriculumDto> listAll() {
        return classCurriculumRepository.findAllByOrderByDepartmentCodeAscProgramAscSemesterAscSectionKeyAsc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ClassCurriculumDto save(ClassCurriculumDto dto) {
        ClassCurriculum entity;
        if (dto.getId() != null) {
            entity = classCurriculumRepository.findById(dto.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Class curriculum not found: " + dto.getId()));
        } else {
            entity = new ClassCurriculum();
        }
        apply(dto, entity);
        validateUnique(entity);
        return toDto(classCurriculumRepository.save(entity));
    }

    public void delete(Long id) {
        classCurriculumRepository.deleteById(id);
    }

    public Optional<ClassCurriculumDto> findBestMatchForStudent(Student student) {
        if (student.getDepartmentEntity() == null) {
            return Optional.empty();
        }
        String dept = student.getDepartmentEntity().getCode();
        ProgramType program = student.getProgram() != null ? student.getProgram() : ProgramType.UG;
        int sem = student.getCurrentSemester() != null ? student.getCurrentSemester() : 1;
        String sec = student.getSection() != null ? student.getSection().trim() : "";

        Optional<ClassCurriculum> exact = classCurriculumRepository
                .findByDepartmentCodeAndProgramAndSemesterAndSectionKey(dept, program, sem, sec);
        if (exact.isPresent()) {
            return exact.map(this::toDto);
        }
        return classCurriculumRepository
                .findByDepartmentCodeAndProgramAndSemesterAndSectionKey(dept, program, sem, "")
                .map(this::toDto);
    }

    private void validateUnique(ClassCurriculum entity) {
        Optional<ClassCurriculum> other = classCurriculumRepository.findByDepartmentCodeAndProgramAndSemesterAndSectionKey(
                entity.getDepartmentCode(), entity.getProgram(), entity.getSemester(), entity.getSectionKey());
        if (other.isPresent() && !other.get().getId().equals(entity.getId())) {
            throw new IllegalArgumentException(
                    "A timetable & syllabus entry already exists for this department, program, semester and section scope.");
        }
    }

    private void apply(ClassCurriculumDto dto, ClassCurriculum entity) {
        if (dto.getDepartmentCode() == null || dto.getDepartmentCode().isBlank()) {
            throw new IllegalArgumentException("Department code is required");
        }
        entity.setDepartmentCode(dto.getDepartmentCode().trim().toUpperCase());
        entity.setProgram(dto.getProgram() != null ? dto.getProgram() : ProgramType.UG);
        if (dto.getSemester() == null || dto.getSemester() < 1 || dto.getSemester() > 16) {
            throw new IllegalArgumentException("Semester must be between 1 and 16");
        }
        entity.setSemester(dto.getSemester());
        String sk = dto.getSectionKey() != null ? dto.getSectionKey().trim() : "";
        entity.setSectionKey(sk);
        entity.setTimetableText(dto.getTimetableText());
        entity.setSyllabusText(dto.getSyllabusText());
        entity.setSyllabusUrl(dto.getSyllabusUrl());
    }

    private ClassCurriculumDto toDto(ClassCurriculum e) {
        ClassCurriculumDto d = new ClassCurriculumDto();
        d.setId(e.getId());
        d.setDepartmentCode(e.getDepartmentCode());
        d.setProgram(e.getProgram());
        d.setSemester(e.getSemester());
        d.setSectionKey(e.getSectionKey());
        d.setTimetableText(e.getTimetableText());
        d.setSyllabusText(e.getSyllabusText());
        d.setSyllabusUrl(e.getSyllabusUrl());
        d.setUpdatedAt(e.getUpdatedAt());
        return d;
    }
}
