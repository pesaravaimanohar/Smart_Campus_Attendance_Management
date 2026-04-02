package com.college.smartattendance.service;

import com.college.smartattendance.dto.DepartmentDto;
import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DepartmentManagementService {

    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private ProgramRepository programRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private FacultyRepository facultyRepository;
    @Autowired private AuditService auditService;

    // ==================== DEPARTMENT OPERATIONS ====================

    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public List<DepartmentDto> getActiveDepartments() {
        return departmentRepository.findByActive(true).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public DepartmentDto getDepartmentById(Long id) {
        return toDto(departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found: " + id)));
    }

    public DepartmentDto getDepartmentByCode(String code) {
        return toDto(departmentRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Department not found: " + code)));
    }

    @Transactional
    public DepartmentDto createDepartment(DepartmentDto dto, Long createdBy) {
        if (departmentRepository.existsByCode(dto.getCode()))
            throw new RuntimeException("Department code already exists: " + dto.getCode());

        Department dept = new Department();
        dept.setCode(dto.getCode());
        dept.setName(dto.getName());
        dept.setActive(true);

        if (dto.getHodId() != null) {
            dept.setHod(facultyRepository.findById(dto.getHodId())
                    .orElseThrow(() -> new RuntimeException("HOD not found: " + dto.getHodId())));
        }

        dept = departmentRepository.save(dept);
        auditService.logAction(createdBy, "Department", dept.getId(), "CREATED",
                null, "Created: " + dto.getCode() + " - " + dto.getName(), null);
        return toDto(dept);
    }

    @Transactional
    public DepartmentDto updateDepartment(Long id, DepartmentDto dto, Long updatedBy) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found: " + id));
        String old = "Code:" + dept.getCode() + ", Name:" + dept.getName();
        if (dto.getName() != null) dept.setName(dto.getName());
        if (dto.getHodId() != null)
            dept.setHod(facultyRepository.findById(dto.getHodId())
                    .orElseThrow(() -> new RuntimeException("HOD not found: " + dto.getHodId())));
        dept = departmentRepository.save(dept);
        auditService.logAction(updatedBy, "Department", dept.getId(), "UPDATED",
                old, "Code:" + dept.getCode() + ", Name:" + dept.getName(), null);
        return toDto(dept);
    }

    @Transactional
    public void setDepartmentStatus(Long id, boolean active, Long updatedBy) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found: " + id));
        if (!active) {
            long activeStudents = studentRepository.findByDepartment(dept.getCode()).stream()
                    .filter(s -> s.getStatus() == StudentStatus.ACTIVE).count();
            long activeFaculty = facultyRepository.findByDepartment(dept.getCode()).stream()
                    .filter(f -> f.getEmploymentStatus() == EmploymentStatus.ACTIVE).count();
            if (activeStudents > 0 || activeFaculty > 0)
                throw new RuntimeException("Cannot deactivate department with active students or faculty");
        }
        dept.setActive(active);
        departmentRepository.save(dept);
        auditService.logAction(updatedBy, "Department", dept.getId(), "STATUS_UPDATED",
                String.valueOf(!active), String.valueOf(active), null);
    }

    @Transactional
    public void setHOD(Long departmentId, Long facultyId, Long updatedBy) {
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found: " + departmentId));
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found: " + facultyId));
        String oldHod = dept.getHod() != null ? dept.getHod().getFacultyId() : "None";
        dept.setHod(faculty);
        departmentRepository.save(dept);
        auditService.logAction(updatedBy, "Department", dept.getId(), "HOD_UPDATED",
                "HOD:" + oldHod, "HOD:" + faculty.getFacultyId(), null);
    }

    // ==================== PROGRAM OPERATIONS ====================

    public List<Program> getAllPrograms() { return programRepository.findAll(); }

    public List<Program> getProgramsByDepartment(Long departmentId) {
        return programRepository.findByDepartmentId(departmentId);
    }

    public List<Program> getActivePrograms() {
        return programRepository.findByActive(true);
    }

    @Transactional
    public Program createProgram(Long departmentId, String code, String name,
            ProgramType type, Integer duration, Long createdBy) {
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found: " + departmentId));
        Program program = new Program();
        program.setDepartment(dept);
        program.setName(name);
        program.setType(type);
        program = programRepository.save(program);
        auditService.logAction(createdBy, "Program", program.getId(), "CREATED",
                null, "Created: " + code + " - " + name, null);
        return program;
    }

    @Transactional
    public void setProgramStatus(Long programId, boolean active, Long updatedBy) {
        Program program = programRepository.findById(programId)
                .orElseThrow(() -> new RuntimeException("Program not found: " + programId));
        program.setActive(active);
        programRepository.save(program);
        auditService.logAction(updatedBy, "Program", program.getId(), "STATUS_UPDATED",
                String.valueOf(!active), String.valueOf(active), null);
    }

    // ==================== HELPER ====================

    private DepartmentDto toDto(Department dept) {
        DepartmentDto dto = new DepartmentDto();
        dto.setId(dept.getId());
        dto.setCode(dept.getCode());
        dto.setName(dept.getName());
        dto.setActive(dept.getActive());
        if (dept.getHod() != null) {
            dto.setHodId(dept.getHod().getId());
            dto.setHodName(dept.getHod().getUser().getFirstName() + " " +
                    dept.getHod().getUser().getLastName());
        }
        return dto;
    }
}
