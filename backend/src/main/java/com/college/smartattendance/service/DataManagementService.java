package com.college.smartattendance.service;

import com.college.smartattendance.dto.*;
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
@Transactional
public class DataManagementService {

    @Autowired private UserRepository userRepository;
    @Autowired private StudentRepository studentRepository;
    @Autowired private FacultyRepository facultyRepository;
    @Autowired private SubjectRepository subjectRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private FacultySubjectMapRepository facultySubjectMapRepository;
    @Autowired private CourseClassRepository courseClassRepository;
    @Autowired private AcademicYearRepository academicYearRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // ===================== DEPARTMENT =====================

    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toDepartmentDto)
                .collect(Collectors.toList());
    }

    public DepartmentDto createDepartment(String code, String name) {
        if (code == null || code.isBlank() || name == null || name.isBlank()) {
            throw new IllegalArgumentException("Department code and name are required");
        }
        String normalizedCode = code.trim().toUpperCase();
        if (departmentRepository.existsByCode(normalizedCode)) {
            throw new IllegalArgumentException("Department with code '" + normalizedCode + "' already exists");
        }
        String normalizedName = name.trim();
        Department dept = new Department(normalizedCode, normalizedName);
        dept.setActive(true);
        return toDepartmentDto(departmentRepository.save(dept));
    }

    public List<DepartmentDto> ensureJntuaDepartments() {
        return JNTUA_DEPARTMENTS.stream()
                .map(spec -> ensureDepartment(spec.code, spec.name))
                .collect(Collectors.toList());
    }

    private DepartmentDto ensureDepartment(String code, String name) {
        String normalizedCode = code.trim().toUpperCase();
        String normalizedName = name.trim();
        Department dept = departmentRepository.findByCode(normalizedCode)
                .orElseGet(() -> {
                    Department created = new Department();
                    created.setCode(normalizedCode);
                    created.setName(normalizedName);
                    created.setActive(true);
                    return departmentRepository.save(created);
                });

        if (!dept.getName().equals(normalizedName)) {
            dept.setName(normalizedName);
            dept = departmentRepository.save(dept);
        }

        if (dept.getActive() == null || !dept.getActive()) {
            dept.setActive(true);
            dept = departmentRepository.save(dept);
        }
        return toDepartmentDto(dept);
    }

    private DepartmentDto toDepartmentDto(Department dept) {
        DepartmentDto dto = new DepartmentDto();
        dto.setId(dept.getId());
        dto.setCode(dept.getCode());
        dto.setName(dept.getName());
        dto.setActive(dept.getActive());
        if (dept.getHod() != null && dept.getHod().getUser() != null) {
            dto.setHodId(dept.getHod().getId());
            dto.setHodName(dept.getHod().getUser().getFirstName() + " " + dept.getHod().getUser().getLastName());
        }
        return dto;
    }

    private static final List<DepartmentSpec> JNTUA_DEPARTMENTS = List.of(
            // UG flagship branches
            new DepartmentSpec("CSE", "Computer Science & Engineering"),
            new DepartmentSpec("CSEAI", "Computer Science & Engineering (AI & ML)"),
            new DepartmentSpec("CSEDS", "Computer Science & Engineering (Data Science)"),
            new DepartmentSpec("CSECS", "Computer Science & Engineering (Cyber Security)"),
            new DepartmentSpec("IT", "Information Technology"),
            new DepartmentSpec("ECE", "Electronics and Communication Engineering"),
            new DepartmentSpec("EEE", "Electrical and Electronics Engineering"),
            new DepartmentSpec("EIE", "Electronics & Instrumentation Engineering"),
            new DepartmentSpec("MECH", "Mechanical Engineering"),
            new DepartmentSpec("AUTO", "Automobile Engineering"),
            new DepartmentSpec("CIVIL", "Civil Engineering"),
            new DepartmentSpec("CHEM", "Chemical Engineering"),
            new DepartmentSpec("BIOTECH", "Biotechnology Engineering"),
            new DepartmentSpec("MET", "Metallurgical & Materials Engineering"),
            new DepartmentSpec("MINING", "Mining Engineering"),
            new DepartmentSpec("FOOD", "Food Technology"),
            new DepartmentSpec("PETRO", "Petroleum Technology"),

            // Professional programs
            new DepartmentSpec("MBA", "Master of Business Administration"),
            new DepartmentSpec("MCA", "Master of Computer Applications"),

            // PG engineering specialisations
            new DepartmentSpec("MTCSE", "M.Tech Computer Science & Engineering"),
            new DepartmentSpec("MTAI", "M.Tech Artificial Intelligence & Machine Learning"),
            new DepartmentSpec("MTDS", "M.Tech Data Science"),
            new DepartmentSpec("MTCYB", "M.Tech Cyber Security"),
            new DepartmentSpec("MTECE", "M.Tech Electronics & Communication Engineering"),
            new DepartmentSpec("MTVLSI", "M.Tech VLSI Design"),
            new DepartmentSpec("MTEMB", "M.Tech Embedded Systems"),
            new DepartmentSpec("MTPWR", "M.Tech Power Systems"),
            new DepartmentSpec("MTMECH", "M.Tech Mechanical Engineering"),
            new DepartmentSpec("MTTHERM", "M.Tech Thermal Engineering"),
            new DepartmentSpec("MTMDES", "M.Tech Machine Design"),
            new DepartmentSpec("MTCIVL", "M.Tech Structural Engineering"),
            new DepartmentSpec("MTTRAN", "M.Tech Transportation Engineering"),
            new DepartmentSpec("MTENV", "M.Tech Environmental Engineering"),
            new DepartmentSpec("MTCHEM", "M.Tech Chemical Engineering")
    );

    private record DepartmentSpec(String code, String name) {}

    // ===================== ACADEMIC YEAR =====================

    public List<AcademicYear> getAllAcademicYears() {
        return academicYearRepository.findAll();
    }

    public AcademicYear createAcademicYear(String name, boolean active) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Academic year name is required");
        }
        if (active) {
            // deactivate all existing active years
            academicYearRepository.findByActiveTrue().ifPresent(ay -> {
                ay.setActive(false);
                academicYearRepository.save(ay);
            });
        }
        AcademicYear ay = new AcademicYear();
        ay.setName(name);
        ay.setActive(active);
        return academicYearRepository.save(ay);
    }

    // ===================== STUDENT =====================

    public List<StudentDto> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::toStudentDto)
                .collect(Collectors.toList());
    }

    public StudentDto createStudent(StudentDto dto) {
        // Create user account
        String username = dto.getRollNumber().toLowerCase();
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("User with username '" + username + "' already exists");
        }

        User user = new User();
        user.setUsername(username);
        // Default password = rollNumber
        user.setPassword(passwordEncoder.encode(dto.getRollNumber()));
        user.setRole(Role.STUDENT);
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setContactNumber(dto.getContactNumber());
        user.setGender(dto.getGender());
        user.setFirstLogin(true);
        user = userRepository.save(user);

        Student student = new Student();
        student.setUser(user);
        student.setRollNumber(dto.getRollNumber());
        student.setStudentId(dto.getStudentId() != null ? dto.getStudentId() : dto.getRollNumber());
        student.setProgram(dto.getProgram());
        student.setCurrentSemester(dto.getCurrentSemester());
        student.setSection(dto.getSection());
        student.setAdmissionYear(dto.getAdmissionYear());
        student.setStatus(dto.getStatus() != null ? dto.getStatus() : StudentStatus.ACTIVE);

        if (dto.getDepartmentCode() != null) {
            departmentRepository.findByCode(dto.getDepartmentCode())
                    .ifPresent(student::setDepartmentEntity);
        }

        student = studentRepository.save(student);
        return toStudentDto(student);
    }

    public StudentDto updateStudent(Long id, StudentDto dto) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + id));

        User user = student.getUser();
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setContactNumber(dto.getContactNumber());
        user.setGender(dto.getGender());
        userRepository.save(user);

        student.setCurrentSemester(dto.getCurrentSemester());
        student.setSection(dto.getSection());
        student.setAdmissionYear(dto.getAdmissionYear());
        if (dto.getStatus() != null) student.setStatus(dto.getStatus());
        if (dto.getProgram() != null) student.setProgram(dto.getProgram());

        if (dto.getDepartmentCode() != null) {
            departmentRepository.findByCode(dto.getDepartmentCode())
                    .ifPresent(student::setDepartmentEntity);
        }

        student = studentRepository.save(student);
        return toStudentDto(student);
    }

    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + id));
        User user = student.getUser();
        studentRepository.delete(student);
        userRepository.delete(user);
    }

    private StudentDto toStudentDto(Student s) {
        StudentDto dto = new StudentDto();
        dto.setId(s.getId());
        dto.setRollNumber(s.getRollNumber());
        dto.setStudentId(s.getStudentId());
        dto.setProgram(s.getProgram());
        dto.setCurrentSemester(s.getCurrentSemester());
        dto.setSection(s.getSection());
        dto.setAdmissionYear(s.getAdmissionYear());
        dto.setStatus(s.getStatus());
        if (s.getUser() != null) {
            dto.setFirstName(s.getUser().getFirstName());
            dto.setLastName(s.getUser().getLastName());
            dto.setEmail(s.getUser().getEmail());
            dto.setContactNumber(s.getUser().getContactNumber());
            dto.setGender(s.getUser().getGender());
        }
        if (s.getDepartmentEntity() != null) {
            dto.setDepartmentCode(s.getDepartmentEntity().getCode());
            dto.setDepartmentName(s.getDepartmentEntity().getName());
        }
        return dto;
    }

    // ===================== FACULTY =====================

    public List<FacultyDto> getAllFaculty() {
        return facultyRepository.findAll().stream()
                .map(this::toFacultyDto)
                .collect(Collectors.toList());
    }

    public FacultyDto createFaculty(FacultyDto dto) {
        String username = dto.getFacultyId().toLowerCase();
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("User with username '" + username + "' already exists");
        }

        User user = new User();
        user.setUsername(username);
        // Default password = facultyId
        user.setPassword(passwordEncoder.encode(dto.getFacultyId()));
        user.setRole(Role.FACULTY);
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setContactNumber(dto.getContactNumber());
        user.setGender(dto.getGender());
        user.setFirstLogin(true);
        user = userRepository.save(user);

        Faculty faculty = new Faculty();
        faculty.setUser(user);
        faculty.setFacultyId(dto.getFacultyId());
        faculty.setDesignation(dto.getDesignation());
        faculty.setQualifications(dto.getQualifications());
        faculty.setEmploymentStatus(dto.getEmploymentStatus() != null ? dto.getEmploymentStatus() : EmploymentStatus.ACTIVE);

        if (dto.getJoiningDate() != null && !dto.getJoiningDate().isEmpty()) {
            try {
                faculty.setJoiningDate(LocalDate.parse(dto.getJoiningDate()));
            } catch (Exception ignored) {}
        }

        if (dto.getDepartmentCode() != null) {
            departmentRepository.findByCode(dto.getDepartmentCode())
                    .ifPresent(faculty::setDepartmentEntity);
        }

        faculty = facultyRepository.save(faculty);
        return toFacultyDto(faculty);
    }

    public FacultyDto updateFaculty(Long id, FacultyDto dto) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Faculty not found with id: " + id));

        User user = faculty.getUser();
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setEmail(dto.getEmail());
        user.setContactNumber(dto.getContactNumber());
        user.setGender(dto.getGender());
        userRepository.save(user);

        faculty.setDesignation(dto.getDesignation());
        faculty.setQualifications(dto.getQualifications());
        if (dto.getEmploymentStatus() != null) faculty.setEmploymentStatus(dto.getEmploymentStatus());

        if (dto.getJoiningDate() != null && !dto.getJoiningDate().isEmpty()) {
            try {
                faculty.setJoiningDate(LocalDate.parse(dto.getJoiningDate()));
            } catch (Exception ignored) {}
        }

        if (dto.getDepartmentCode() != null) {
            departmentRepository.findByCode(dto.getDepartmentCode())
                    .ifPresent(faculty::setDepartmentEntity);
        }

        faculty = facultyRepository.save(faculty);
        return toFacultyDto(faculty);
    }

    public void deleteFaculty(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Faculty not found with id: " + id));
        User user = faculty.getUser();
        facultyRepository.delete(faculty);
        userRepository.delete(user);
    }

    private FacultyDto toFacultyDto(Faculty f) {
        FacultyDto dto = new FacultyDto();
        dto.setId(f.getId());
        dto.setFacultyId(f.getFacultyId());
        dto.setDesignation(f.getDesignation());
        dto.setQualifications(f.getQualifications());
        dto.setEmploymentStatus(f.getEmploymentStatus());
        dto.setJoiningDate(f.getJoiningDate() != null ? f.getJoiningDate().toString() : null);
        if (f.getUser() != null) {
            dto.setFirstName(f.getUser().getFirstName());
            dto.setLastName(f.getUser().getLastName());
            dto.setEmail(f.getUser().getEmail());
            dto.setContactNumber(f.getUser().getContactNumber());
            dto.setGender(f.getUser().getGender());
        }
        if (f.getDepartmentEntity() != null) {
            dto.setDepartmentCode(f.getDepartmentEntity().getCode());
            dto.setDepartmentName(f.getDepartmentEntity().getName());
        }
        return dto;
    }

    // ===================== SUBJECT =====================

    public List<SubjectDto> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(s -> new SubjectDto(s.getId(), s.getName(), s.getCode()))
                .collect(Collectors.toList());
    }

    public SubjectDto createSubject(SubjectDto dto) {
        Subject subject = new Subject();
        subject.setName(dto.getName());
        subject.setCode(dto.getCode());
        subject = subjectRepository.save(subject);
        return new SubjectDto(subject.getId(), subject.getName(), subject.getCode());
    }

    public SubjectDto updateSubject(Long id, SubjectDto dto) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found with id: " + id));
        subject.setName(dto.getName());
        subject.setCode(dto.getCode());
        subject = subjectRepository.save(subject);
        return new SubjectDto(subject.getId(), subject.getName(), subject.getCode());
    }

    public void deleteSubject(Long id) {
        subjectRepository.deleteById(id);
    }

    // ===================== CLASSES =====================

    public List<CourseClass> getAllClasses() {
        return courseClassRepository.findAll();
    }

    // ===================== FACULTY-SUBJECT ASSIGNMENT =====================

    public List<FacultySubjectAssignmentDto> getAllAssignments() {
        return facultySubjectMapRepository.findAll().stream()
                .map(this::toAssignmentDto)
                .collect(Collectors.toList());
    }

    public FacultySubjectAssignmentDto createAssignment(FacultySubjectAssignmentDto dto) {
        FacultySubjectMap map = new FacultySubjectMap();

        Faculty faculty = facultyRepository.findById(dto.getFacultyId())
                .orElseThrow(() -> new IllegalArgumentException("Faculty not found"));
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found"));
        CourseClass courseClass = courseClassRepository.findById(dto.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));
        AcademicYear academicYear = academicYearRepository.findById(dto.getAcademicYearId())
                .orElseThrow(() -> new IllegalArgumentException("Academic year not found"));

        map.setFaculty(faculty);
        map.setSubject(subject);
        map.setCourseClass(courseClass);
        map.setAcademicYear(academicYear);
        map.setSection(dto.getSection());
        map.setLocked(dto.getLocked() != null ? dto.getLocked() : false);

        map = facultySubjectMapRepository.save(map);
        return toAssignmentDto(map);
    }

    public void deleteAssignment(Long id) {
        facultySubjectMapRepository.deleteById(id);
    }

    private FacultySubjectAssignmentDto toAssignmentDto(FacultySubjectMap m) {
        FacultySubjectAssignmentDto dto = new FacultySubjectAssignmentDto();
        dto.setId(m.getId());
        dto.setSection(m.getSection());
        dto.setLocked(m.getLocked());

        if (m.getFaculty() != null) {
            dto.setFacultyId(m.getFaculty().getId());
            dto.setFacultyIdCode(m.getFaculty().getFacultyId());
            if (m.getFaculty().getUser() != null) {
                dto.setFacultyName(m.getFaculty().getUser().getFirstName() + " " + m.getFaculty().getUser().getLastName());
            }
        }
        if (m.getSubject() != null) {
            dto.setSubjectId(m.getSubject().getId());
            dto.setSubjectName(m.getSubject().getName());
            dto.setSubjectCode(m.getSubject().getCode());
        }
        if (m.getCourseClass() != null) {
            dto.setClassId(m.getCourseClass().getId());
            dto.setClassName(m.getCourseClass().getName());
        }
        if (m.getAcademicYear() != null) {
            dto.setAcademicYearId(m.getAcademicYear().getId());
            dto.setAcademicYearName(m.getAcademicYear().getName());
        }
        return dto;
    }
}
