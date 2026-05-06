package com.college.smartattendance.service;

import com.college.smartattendance.dto.DepartmentDto;
import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class DepartmentManagementService {

    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private ProgramRepository programRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private FacultyRepository facultyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CourseClassRepository courseClassRepository;
    @Autowired private PasswordEncoder passwordEncoder;
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

        dept = departmentRepository.save(dept);

        String hodUsername = "hod_" + dept.getCode().toLowerCase();
        if (userRepository.findByUsername(hodUsername).isEmpty()) {
            User hodUser = new User();
            hodUser.setUsername(hodUsername);
            hodUser.setPassword(passwordEncoder.encode("hod123")); // default password
            hodUser.setRole(Role.HOD);
            hodUser.setFirstName("Head of Department");
            hodUser.setLastName(dept.getCode().toUpperCase());
            hodUser.setEmail("hod_" + dept.getCode().toLowerCase() + "@jntua.in");
            hodUser.setContactNumber("");
            hodUser.setFirstLogin(true);
            hodUser = userRepository.save(hodUser);

            Faculty hodFaculty = new Faculty();
            hodFaculty.setUser(hodUser);
            hodFaculty.setFacultyId("HOD_" + dept.getCode().toUpperCase());
            hodFaculty.setDepartment(dept.getCode());
            hodFaculty.setEmploymentStatus(EmploymentStatus.ACTIVE);
            hodFaculty.setDesignation("HOD");

            facultyRepository.save(hodFaculty);
            dept.setHod(hodFaculty);
            dept = departmentRepository.save(dept);
        }

        auditService.logAction(createdBy, "Department", dept.getId(), "CREATED",
                null, "Created: " + dto.getCode() + " - " + dto.getName(), null);

        // Auto-generate classes
        String deptCode = dept.getCode();
        boolean isPgOnly = deptCode.equalsIgnoreCase("MBA") || deptCode.equalsIgnoreCase("MCA") || deptCode.toUpperCase().startsWith("MT");

        if (!isPgOnly) {
            for (int year = 1; year <= 4; year++) {
                createClassIfNotExists("B.Tech " + year + getOrdinal(year) + " Year", deptCode, year, ProgramType.UG);
            }
        }
        
        for (int year = 1; year <= 2; year++) {
            createClassIfNotExists("M.Tech " + year + getOrdinal(year) + " Year", deptCode, year, ProgramType.PG);
        }
        
        if ("CSE".equalsIgnoreCase(deptCode)) {
            for (int year = 1; year <= 2; year++) {
                createClassIfNotExists("MCA " + year + getOrdinal(year) + " Year", deptCode, year, ProgramType.PG);
            }
        }

        return toDto(dept);
    }

    private String getOrdinal(int number) {
        if (number == 1) return "st";
        if (number == 2) return "nd";
        if (number == 3) return "rd";
        return "th";
    }

    private void createClassIfNotExists(String name, String deptCode, int year, ProgramType type) {
        boolean exists = courseClassRepository.findAll().stream()
                .anyMatch(c -> c.getName().equalsIgnoreCase(name) && c.getDepartment().equalsIgnoreCase(deptCode));
        if (!exists) {
            CourseClass cc = new CourseClass();
            cc.setName(name);
            cc.setDepartment(deptCode);
            cc.setYearLevel(year);
            cc.setProgramType(type);
            courseClassRepository.save(cc);
        }
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
