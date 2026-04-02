package com.college.smartattendance.service;

import com.college.smartattendance.dto.FacultyDto;
import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyManagementService {

    @Autowired private FacultyRepository facultyRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private AuditService auditService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private UserService userService;

    public List<FacultyDto> getAllFaculty() {
        return facultyRepository.findAll().stream()
                .map(this::convertToDto).collect(Collectors.toList());
    }

    public FacultyDto getFacultyById(Long id) {
        return convertToDto(facultyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Faculty not found: " + id)));
    }

    public FacultyDto getFacultyByFacultyId(String facultyId) {
        return convertToDto(facultyRepository.findByFacultyId(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found: " + facultyId)));
    }

    public List<FacultyDto> getFacultyByDepartment(String departmentCode) {
        return facultyRepository.findByDepartment(departmentCode).stream()
                .map(this::convertToDto).collect(Collectors.toList());
    }

    public List<FacultyDto> getFacultyByStatus(EmploymentStatus status) {
        return facultyRepository.findByEmploymentStatus(status).stream()
                .map(this::convertToDto).collect(Collectors.toList());
    }

    public List<FacultyDto> getFacultyByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(user -> facultyRepository.findByUser_Id(user.getId()))
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FacultyDto createFaculty(FacultyDto dto, Long createdBy) {
        if (userRepository.existsByUsername(dto.getFacultyId()))
            throw new RuntimeException("Faculty ID already exists: " + dto.getFacultyId());
        if (dto.getEmail() != null && userRepository.existsByEmail(dto.getEmail()))
            throw new RuntimeException("Email already exists: " + dto.getEmail());
        if (dto.getDepartmentCode() != null && !departmentRepository.existsByCode(dto.getDepartmentCode()))
            throw new RuntimeException("Department not found: " + dto.getDepartmentCode());

        User user = new User();
        user.setUsername(dto.getFacultyId());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setContactNumber(dto.getMobile());
        user.setGender(dto.getGender());
        user.setDob(dto.getDob());
        user.setRole(dto.getRole() != null ? dto.getRole() : Role.FACULTY);
        user.setFirstLogin(true);
        user.setPassword(passwordEncoder.encode(userService.generateDefaultPassword(user)));
        user = userRepository.save(user);

        Faculty faculty = new Faculty();
        faculty.setUser(user);
        faculty.setFacultyId(dto.getFacultyId());
        faculty.setDepartment(dto.getDepartmentCode());
        faculty.setDesignation(dto.getDesignation());
        faculty.setQualifications(dto.getQualifications());
        // joiningDate is String in DTO; parse safely
        if (dto.getJoiningDate() != null && !dto.getJoiningDate().isBlank()) {
            try { faculty.setJoiningDate(LocalDate.parse(dto.getJoiningDate())); }
            catch (Exception ignored) {}
        }
        faculty.setEmploymentStatus(EmploymentStatus.ACTIVE);
        faculty = facultyRepository.save(faculty);

        auditService.logAction(createdBy, "Faculty", faculty.getId(), "CREATED",
                null, "Faculty created: " + dto.getFacultyId(), null);
        return convertToDto(faculty);
    }

    @Transactional
    public FacultyDto updateFaculty(Long id, FacultyDto dto, Long updatedBy) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Faculty not found: " + id));
        User user = faculty.getUser();
        String oldData = buildDataString(faculty, user);

        if (dto.getFirstName() != null) user.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) user.setLastName(dto.getLastName());
        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(dto.getEmail()))
                throw new RuntimeException("Email already exists: " + dto.getEmail());
            user.setEmail(dto.getEmail());
        }
        if (dto.getMobile() != null) user.setContactNumber(dto.getMobile());
        if (dto.getGender() != null) user.setGender(dto.getGender());
        if (dto.getDob() != null) user.setDob(dto.getDob());
        if (dto.getRole() != null) user.setRole(dto.getRole());
        userRepository.save(user);

        if (dto.getDesignation() != null) faculty.setDesignation(dto.getDesignation());
        if (dto.getQualifications() != null) faculty.setQualifications(dto.getQualifications());
        if (dto.getJoiningDate() != null && !dto.getJoiningDate().isBlank()) {
            try { faculty.setJoiningDate(LocalDate.parse(dto.getJoiningDate())); }
            catch (Exception ignored) {}
        }
        if (dto.getEmploymentStatus() != null) faculty.setEmploymentStatus(dto.getEmploymentStatus());
        faculty = facultyRepository.save(faculty);

        auditService.logAction(updatedBy, "Faculty", faculty.getId(), "UPDATED",
                oldData, buildDataString(faculty, user), null);
        return convertToDto(faculty);
    }

    @Transactional
    public void updateFacultyStatus(Long id, EmploymentStatus newStatus, Long updatedBy) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Faculty not found: " + id));
        EmploymentStatus old = faculty.getEmploymentStatus();
        faculty.setEmploymentStatus(newStatus);
        facultyRepository.save(faculty);
        auditService.logAction(updatedBy, "Faculty", faculty.getId(), "STATUS_UPDATED",
                old.toString(), newStatus.toString(), null);
    }

    @Transactional
    public void deleteFaculty(Long id, Long deletedBy) {
        updateFacultyStatus(id, EmploymentStatus.RELIEVED, deletedBy);
    }

    private FacultyDto convertToDto(Faculty faculty) {
        FacultyDto dto = new FacultyDto();
        User user = faculty.getUser();
        dto.setId(faculty.getId());
        dto.setFacultyId(faculty.getFacultyId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setMobile(user.getContactNumber());
        dto.setGender(user.getGender());
        dto.setDob(user.getDob());
        dto.setRole(user.getRole());
        dto.setDepartmentCode(faculty.getDepartment());
        dto.setDesignation(faculty.getDesignation());
        dto.setQualifications(faculty.getQualifications());
        dto.setJoiningDate(faculty.getJoiningDate() != null ? faculty.getJoiningDate().toString() : null);
        dto.setEmploymentStatus(faculty.getEmploymentStatus());
        return dto;
    }

    private String buildDataString(Faculty faculty, User user) {
        return String.format("FacultyID:%s, Name:%s %s, Email:%s, Role:%s, Status:%s",
                faculty.getFacultyId(), user.getFirstName(), user.getLastName(),
                user.getEmail(), user.getRole(), faculty.getEmploymentStatus());
    }
}
