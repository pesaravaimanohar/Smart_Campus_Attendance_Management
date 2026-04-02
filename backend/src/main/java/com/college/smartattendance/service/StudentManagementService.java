package com.college.smartattendance.service;

import com.college.smartattendance.dto.StudentDto;
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
public class StudentManagementService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private AuditService auditService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserService userService;

    /**
     * Get all students
     */
    public List<StudentDto> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get student by ID
     */
    public StudentDto getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));
        return convertToDto(student);
    }

    /**
     * Get student by roll number
     */
    public StudentDto getStudentByRollNumber(String rollNumber) {
        Student student = studentRepository.findByRollNumber(rollNumber)
                .orElseThrow(() -> new RuntimeException("Student not found with roll number: " + rollNumber));
        return convertToDto(student);
    }

    /**
     * Get students by department
     */
    public List<StudentDto> getStudentsByDepartment(String departmentCode) {
        return studentRepository.findByDepartment(departmentCode).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get students by semester
     */
    public List<StudentDto> getStudentsBySemester(Integer semester) {
        return studentRepository.findByCurrentSemester(semester).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get students by status
     */
    public List<StudentDto> getStudentsByStatus(StudentStatus status) {
        return studentRepository.findByStatus(status).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get students by department and semester
     */
    public List<StudentDto> getStudentsByDepartmentAndSemester(String departmentCode, Integer semester) {
        return studentRepository.findByDepartmentAndCurrentSemester(departmentCode, semester).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Create a new student
     */
    @Transactional
    public StudentDto createStudent(StudentDto dto, Long createdBy) {
        // Check for duplicate roll number
        if (userRepository.existsByUsername(dto.getRollNumber())) {
            throw new RuntimeException("Roll number already exists: " + dto.getRollNumber());
        }

        // Check for duplicate email
        if (dto.getEmail() != null && userRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already exists: " + dto.getEmail());
        }

        // Verify department exists
        if (dto.getDepartmentCode() != null && !departmentRepository.existsByCode(dto.getDepartmentCode())) {
            throw new RuntimeException("Department not found: " + dto.getDepartmentCode());
        }

        // Create User
        User user = new User();
        user.setUsername(dto.getRollNumber());
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setContactNumber(dto.getMobile());
        user.setGender(dto.getGender());
        user.setDob(dto.getDob());
        user.setRole(Role.STUDENT);
        user.setFirstLogin(true);

        // Generate default password
        String rawPassword = userService.generateDefaultPassword(user);
        user.setPassword(passwordEncoder.encode(rawPassword));

        user = userRepository.save(user);

        // Create Student
        Student student = new Student();
        student.setUser(user);
        student.setRollNumber(dto.getRollNumber());
        student.setDepartment(dto.getDepartmentCode());
        student.setProgram(dto.getProgram());
        student.setCurrentSemester(dto.getCurrentSemester() != null ? dto.getCurrentSemester() : 1);
        student.setSection(dto.getSection());
        student.setAdmissionYear(dto.getAdmissionYear() != null ? dto.getAdmissionYear() : LocalDate.now().getYear());
        student.setStatus(StudentStatus.ACTIVE);

        student = studentRepository.save(student);

        // Audit log
        auditService.logAction(createdBy, "Student", student.getId(), "CREATED",
                null, "Student created: " + dto.getRollNumber(), null);

        return convertToDto(student);
    }

    /**
     * Update student
     */
    @Transactional
    public StudentDto updateStudent(Long id, StudentDto dto, Long updatedBy) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));

        User user = student.getUser();
        String oldData = buildOldDataString(student, user);

        // Update User
        if (dto.getFirstName() != null)
            user.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null)
            user.setLastName(dto.getLastName());
        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new RuntimeException("Email already exists: " + dto.getEmail());
            }
            user.setEmail(dto.getEmail());
        }
        if (dto.getMobile() != null)
            user.setContactNumber(dto.getMobile());
        if (dto.getGender() != null)
            user.setGender(dto.getGender());
        if (dto.getDob() != null)
            user.setDob(dto.getDob());

        userRepository.save(user);

        // Update Student
        if (dto.getSection() != null)
            student.setSection(dto.getSection());
        if (dto.getCurrentSemester() != null)
            student.setCurrentSemester(dto.getCurrentSemester());
        if (dto.getProgram() != null)
            student.setProgram(dto.getProgram());
        if (dto.getAdmissionYear() != null)
            student.setAdmissionYear(dto.getAdmissionYear());
        if (dto.getStatus() != null)
            student.setStatus(dto.getStatus());

        student = studentRepository.save(student);

        String newData = buildOldDataString(student, user);

        // Audit log
        auditService.logAction(updatedBy, "Student", student.getId(), "UPDATED",
                oldData, newData, null);

        return convertToDto(student);
    }

    /**
     * Update student status
     */
    @Transactional
    public void updateStudentStatus(Long id, StudentStatus newStatus, Long updatedBy) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + id));

        StudentStatus oldStatus = student.getStatus();
        student.setStatus(newStatus);
        studentRepository.save(student);

        // Audit log
        auditService.logAction(updatedBy, "Student", student.getId(), "STATUS_UPDATED",
                oldStatus.toString(), newStatus.toString(), null);
    }

    /**
     * Delete student (soft delete via status change)
     */
    @Transactional
    public void deleteStudent(Long id, Long deletedBy) {
        updateStudentStatus(id, StudentStatus.WITHDRAWN, deletedBy);
    }

    /**
     * Convert Student entity to DTO
     */
    private StudentDto convertToDto(Student student) {
        StudentDto dto = new StudentDto();
        User user = student.getUser();

        dto.setId(student.getId());
        dto.setRollNumber(student.getRollNumber());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setMobile(user.getContactNumber());
        dto.setGender(user.getGender());
        dto.setDob(user.getDob());
        dto.setDepartmentCode(student.getDepartment());
        dto.setProgram(student.getProgram());
        dto.setCurrentSemester(student.getCurrentSemester());
        dto.setSection(student.getSection());
        dto.setAdmissionYear(student.getAdmissionYear());
        dto.setStatus(student.getStatus());

        return dto;
    }

    /**
     * Build old data string for audit logging
     */
    private String buildOldDataString(Student student, User user) {
        return String.format("Roll: %s, Name: %s %s, Email: %s, Semester: %d, Status: %s",
                student.getRollNumber(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                student.getCurrentSemester(),
                student.getStatus());
    }
}
