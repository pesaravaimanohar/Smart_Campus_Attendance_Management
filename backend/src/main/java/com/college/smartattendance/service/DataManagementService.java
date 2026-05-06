package com.college.smartattendance.service;

import com.college.smartattendance.dto.*;
import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class DataManagementService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private FacultyRepository facultyRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private FacultySubjectMapRepository facultySubjectMapRepository;
    @Autowired
    private CourseClassRepository courseClassRepository;
    @Autowired
    private AcademicYearRepository academicYearRepository;
    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;
    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;
    @Autowired
    private ProgramRepository programRepository;
    @Autowired
    private StudentClassMapRepository studentClassMapRepository;
    @Autowired
    private ManualOverrideLogRepository manualOverrideLogRepository;
    @Autowired
    private StudentSemesterHistoryRepository studentSemesterHistoryRepository;
    @Autowired
    private TempUploadDataRepository tempUploadDataRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private LabFacultyAssignmentRepository labFacultyAssignmentRepository;

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
        
        Department dept;
        Optional<Department> existing = departmentRepository.findByCode(normalizedCode);
        if (existing.isPresent()) {
            dept = existing.get();
        } else {
            String normalizedName = name.trim();
            dept = new Department(normalizedCode, normalizedName);
            dept.setActive(true);
            dept = departmentRepository.save(dept);
        }
        
        // Ensure default programs (UG & PG) exist for this department so it shows in Academic Explorer
        ensureDefaultPrograms(dept);
        
        return toDepartmentDto(dept);
    }

    public void deleteDepartment(Long id) {
        System.out.println("DEBUG: Attempting to delete department with id: " + id);
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with id: " + id));
        
        // Safety check: Don't delete if there are students or faculty assigned
        if (studentRepository.countByDepartmentEntity_Id(id) > 0) {
            throw new IllegalStateException("Cannot delete department with assigned students");
        }
        if (facultyRepository.countByDepartmentEntity_Id(id) > 0) {
            throw new IllegalStateException("Cannot delete department with assigned faculty");
        }
        
        // Check for classes associated with this department code
        if (courseClassRepository.findAll().stream().anyMatch(c -> c.getDepartment().equals(dept.getCode()))) {
            throw new IllegalStateException("Cannot delete department with associated classes. Delete classes first.");
        }

        // Delete related programs first
        List<Program> programs = programRepository.findByDepartmentId(id);
        System.out.println("DEBUG: Deleting " + programs.size() + " associated programs.");
        programRepository.deleteAll(programs);
        
        departmentRepository.delete(dept);
        System.out.println("DEBUG: Department deleted successfully.");
    }

    private void ensureDefaultPrograms(Department dept) {
        List<Program> existingPrograms = programRepository.findByDepartmentId(dept.getId());
        String code = dept.getCode().toUpperCase();

        // Rules for default program creation:
        // 1. MBA -> PG only
        // 2. MT* -> PG only
        // 3. Others -> Both (or just UG if we want strict separation, but keeping both for flexibility unless filtered in view)
        
        boolean isPgOnly = code.equals("MBA") || code.startsWith("MT");

        // Create UG Program if not exists and not a PG-only department
        if (!isPgOnly && existingPrograms.stream().noneMatch(p -> p.getType() == ProgramType.UG)) {
            Program ug = new Program("B.Tech " + dept.getCode(), ProgramType.UG, 4, 8);
            ug.setDepartment(dept);
            ug.setActive(true);
            programRepository.save(ug);
        }

        // Create PG Program if not exists
        if (existingPrograms.stream().noneMatch(p -> p.getType() == ProgramType.PG && !p.getName().equals("MCA"))) {
            String prefix = isPgOnly ? "" : "M.Tech ";
            Program pg = new Program(prefix + dept.getCode(), ProgramType.PG, 2, 4);
            pg.setDepartment(dept);
            pg.setActive(true);
            programRepository.save(pg);
        }

        // Specifically create MCA for CSE department
        if (code.equals("CSE")) {
            boolean hasMca = existingPrograms.stream().anyMatch(p -> p.getName().equals("MCA"));
            if (!hasMca) {
                Program mca = new Program("MCA", ProgramType.PG, 2, 4);
                mca.setDepartment(dept);
                mca.setActive(true);
                programRepository.save(mca);
            }
        }
    }

    private void ensureDefaultClasses(Department dept) {
        String code = dept.getCode().toUpperCase();
        boolean isPgOnly = code.equals("MBA") || code.startsWith("MT");

        // UG: 1st to 4th Year
        if (!isPgOnly) {
            for (int year = 1; year <= 4; year++) {
                String name = "B.Tech " + code + " " + year + (year == 1 ? "st" : year == 2 ? "nd" : year == 3 ? "rd" : "th") + " Year";
                ensureClass(name, code, year, ProgramType.UG);
            }
        }

        // PG: 1st to 2nd Year
        if (!code.equals("MCA")) {
            for (int year = 1; year <= 2; year++) {
                String name = (isPgOnly ? "" : "M.Tech ") + code + " " + year + (year == 1 ? "st" : "nd") + " Year";
                ensureClass(name, code, year, ProgramType.PG);
            }
        }

        // MCA for CSE
        if (code.equals("CSE")) {
            for (int year = 1; year <= 2; year++) {
                String name = "MCA " + year + (year == 1 ? "st" : "nd") + " Year";
                ensureClass(name, code, year, ProgramType.PG);
            }
        }
    }

    private void ensureClass(String name, String deptCode, int year, ProgramType type) {
        boolean exists = courseClassRepository.findAll().stream()
                .anyMatch(c -> c.getName().equalsIgnoreCase(name) && 
                              deptCode.equalsIgnoreCase(c.getDepartment()) && 
                              c.getProgramType() == type);
        if (!exists) {
            CourseClass cc = new CourseClass();
            cc.setName(name);
            cc.setDepartment(deptCode);
            cc.setYearLevel(year);
            cc.setProgramType(type);
            courseClassRepository.save(cc);
        }
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

        // Ensure default programs (UG & PG) exist for this department so it shows in Academic Explorer
        ensureDefaultPrograms(dept);
        ensureDefaultClasses(dept);

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

    @Transactional
    public void cleanupUnwantedDepartments() {
        Department cse = departmentRepository.findByCode("CSE").orElse(null);
        Department ece = departmentRepository.findByCode("ECE").orElse(null);
        Department eee = departmentRepository.findByCode("EEE").orElse(null);
        Department mech = departmentRepository.findByCode("MECH").orElse(null);
        Department civil = departmentRepository.findByCode("CIVIL").orElse(null);
        Department it = departmentRepository.findByCode("IT").orElse(null);

        List<String> unwantedCodes = List.of("MCA", "MBA", "CHEMICAL", "MTCSE", "MTECE", "MTMECH", "MTCIVL", "MTCHEM", "MTEEE");
        
        for (String code : unwantedCodes) {
            departmentRepository.findByCode(code).ifPresent(dept -> {
                Department target = null;
                if (code.equals("MCA") || code.equals("MTCSE")) target = cse;
                else if (code.equals("MTECE")) target = ece;
                else if (code.equals("MTEEE")) target = eee;
                else if (code.equals("MTMECH")) target = mech;
                else if (code.equals("MTCIVL")) target = civil;
                else if (code.equals("MTCHEM") || code.equals("CHEMICAL")) target = it;

                if (target != null) {
                    final Department finalTarget = target;
                    studentRepository.findByDepartmentEntity_Id(dept.getId()).forEach(s -> {
                        s.setDepartmentEntity(finalTarget);
                        s.setDepartment(finalTarget.getCode());
                        studentRepository.save(s);
                    });
                    facultyRepository.findByDepartmentEntity_Id(dept.getId()).forEach(f -> {
                        f.setDepartmentEntity(finalTarget);
                        f.setDepartment(finalTarget.getCode());
                        facultyRepository.save(f);
                    });
                    courseClassRepository.findByDepartment(dept.getCode()).forEach(c -> {
                        c.setDepartment(finalTarget.getCode());
                        courseClassRepository.save(c);
                    });
                } else {
                    // Reassign to CSE as fallback if no specific target
                    if (cse != null) {
                        studentRepository.findByDepartmentEntity_Id(dept.getId()).forEach(s -> {
                            s.setDepartmentEntity(cse);
                            s.setDepartment(cse.getCode());
                            studentRepository.save(s);
                        });
                        facultyRepository.findByDepartmentEntity_Id(dept.getId()).forEach(f -> {
                            f.setDepartmentEntity(cse);
                            f.setDepartment(cse.getCode());
                            facultyRepository.save(f);
                        });
                        courseClassRepository.findByDepartment(dept.getCode()).forEach(c -> {
                            c.setDepartment(cse.getCode());
                            courseClassRepository.save(c);
                        });
                    }
                }

                // Delete programs for this department first to prevent constraint violations
                programRepository.findByDepartmentId(dept.getId()).forEach(programRepository::delete);
                departmentRepository.delete(dept);
            });
        }
    }

    private static final List<DepartmentSpec> JNTUA_DEPARTMENTS = List.of(
        new DepartmentSpec("CSE", "Computer Science and Engineering"),
        new DepartmentSpec("ECE", "Electronics and Communication Engineering"),
        new DepartmentSpec("EEE", "Electrical and Electronics Engineering"),
        new DepartmentSpec("MECH", "Mechanical Engineering"),
        new DepartmentSpec("CIVIL", "Civil Engineering"),
        new DepartmentSpec("IT", "Information Technology"),
        new DepartmentSpec("CHEMICAL", "Chemical Engineering"),
        new DepartmentSpec("MBA", "Master of Business Administration"),
        new DepartmentSpec("MCA", "Master of Computer Applications")
    );

    private record DepartmentSpec(String code, String name) {
    }

    public DepartmentDto assignHod(String departmentCode, Long facultyId) {
        Department dept = departmentRepository.findByCode(departmentCode)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with code: " + departmentCode));
        
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new IllegalArgumentException("Faculty not found with id: " + facultyId));

        // Downgrade old HOD to FACULTY if one exists
        if (dept.getHod() != null && dept.getHod().getUser() != null) {
            User oldHodUser = dept.getHod().getUser();
            if (oldHodUser.getRole() == Role.HOD) {
                oldHodUser.setRole(Role.FACULTY);
                userRepository.save(oldHodUser);
            }
        }

        dept.setHod(faculty);
        
        // Set new HOD user role to HOD
        if (faculty.getUser() != null) {
            faculty.getUser().setRole(Role.HOD);
            userRepository.save(faculty.getUser());
        }

        departmentRepository.save(dept);
        return toDepartmentDto(dept);
    }

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
        String username = dto.getRollNumber().toLowerCase();
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Student with roll number '" + dto.getRollNumber() + "' already exists");
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank() && userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("User with email '" + dto.getEmail() + "' already exists");
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
        
        // Link to class if classId is provided
        if (dto.getClassId() != null) {
            linkStudentToClass(student, dto.getClassId());
        }
        
        return toStudentDto(student);
    }

    private void linkStudentToClass(Student student, Long classId) {
        CourseClass cc = courseClassRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found with id: " + classId));
        
        AcademicYear activeYear = academicYearRepository.findByActiveTrue()
                .orElseGet(() -> {
                    // Fallback to most recent if none marked active
                    return academicYearRepository.findAll().stream()
                            .sorted((a, b) -> b.getName().compareTo(a.getName()))
                            .findFirst()
                            .orElseThrow(() -> new IllegalStateException("No academic years found"));
                });
        
        // Validation: One student can only be in one class at once
        Optional<StudentClassMap> existingMap = studentClassMapRepository.findByStudentAndAcademicYear(student, activeYear);
        if (existingMap.isPresent()) {
            if (existingMap.get().getCourseClass().getId().equals(classId)) {
                return; // Already in this class, no action needed
            }
            throw new IllegalStateException("Student " + student.getRollNumber() + " is already enrolled in class: " + 
                existingMap.get().getCourseClass().getName() + " for academic year " + activeYear.getName());
        }

        StudentClassMap map = new StudentClassMap();
        map.setStudent(student);
        map.setCourseClass(cc);
        map.setAcademicYear(activeYear);
        studentClassMapRepository.save(map);
    }


    public List<StudentDto> getStudentsByClassId(Long classId) {
        System.out.println("Fetching students for class ID: " + classId);
        
        // First try: filter by active academic year
        AcademicYear activeYear = academicYearRepository.findByActiveTrue()
                .orElseGet(() -> academicYearRepository.findAll().stream()
                        .sorted((a, b) -> b.getName().compareTo(a.getName()))
                        .findFirst()
                        .orElse(null));
        
        List<StudentClassMap> mappings;
        
        if (activeYear != null) {
            System.out.println("Using academic year: " + activeYear.getName() + " (ID: " + activeYear.getId() + ")");
            mappings = studentClassMapRepository.findByCourseClass_IdAndAcademicYear_Id(classId, activeYear.getId());
            System.out.println("Found " + mappings.size() + " student mappings for class " + classId + " in year " + activeYear.getId());
        } else {
            mappings = new ArrayList<>();
        }
        
        // Fallback: if no students found with academic year filter, get ALL mappings for this class
        if (mappings.isEmpty()) {
            System.out.println("No mappings found with academic year filter, falling back to all mappings for class " + classId);
            mappings = studentClassMapRepository.findByCourseClass_Id(classId);
            System.out.println("Fallback found " + mappings.size() + " student mappings");
        }
        
        return mappings.stream()
                .map(StudentClassMap::getStudent)
                .filter(Objects::nonNull)
                .map(this::toStudentDto)
                .collect(Collectors.toList());
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
        if (dto.getStatus() != null)
            student.setStatus(dto.getStatus());
        if (dto.getProgram() != null)
            student.setProgram(dto.getProgram());

        if (dto.getDepartmentCode() != null) {
            departmentRepository.findByCode(dto.getDepartmentCode())
                    .ifPresent(student::setDepartmentEntity);
        }

        student = studentRepository.save(student);
        return toStudentDto(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + id));
        User user = student.getUser();
        
        // 1. Clear class mappings
        studentClassMapRepository.deleteByStudent_Id(id);
        
        // 2. Clear attendance data
        attendanceRecordRepository.deleteByStudent_Id(id);
        
        // 3. Clear semester history
        studentSemesterHistoryRepository.deleteByStudent_Id(id);
        
        // 4. Delete student and user
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
        } else if (s.getDepartment() != null && !s.getDepartment().isBlank()) {
            dto.setDepartmentCode(s.getDepartment().trim());
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
        user.setRole(resolveFacultyAccountRole(dto.getRole()));
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
        faculty.setEmploymentStatus(
                dto.getEmploymentStatus() != null ? dto.getEmploymentStatus() : EmploymentStatus.ACTIVE);

        if (dto.getJoiningDate() != null && !dto.getJoiningDate().isEmpty()) {
            try {
                faculty.setJoiningDate(LocalDate.parse(dto.getJoiningDate()));
            } catch (Exception ignored) {
            }
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
        if (dto.getRole() != null) {
            user.setRole(resolveFacultyAccountRole(dto.getRole()));
        }
        userRepository.save(user);

        faculty.setDesignation(dto.getDesignation());
        faculty.setQualifications(dto.getQualifications());
        if (dto.getEmploymentStatus() != null)
            faculty.setEmploymentStatus(dto.getEmploymentStatus());

        if (dto.getJoiningDate() != null && !dto.getJoiningDate().isEmpty()) {
            try {
                faculty.setJoiningDate(LocalDate.parse(dto.getJoiningDate()));
            } catch (Exception ignored) {
            }
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

    public FacultyDto assignPrincipal(Long facultyId) {
        // Downgrade existing principal(s) to FACULTY
        List<User> existingPrincipals = userRepository.findByRole(Role.PRINCIPAL);
        for (User oldPrincipal : existingPrincipals) {
            oldPrincipal.setRole(Role.FACULTY);
            userRepository.save(oldPrincipal);
        }

        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new IllegalArgumentException("Faculty not found with id: " + facultyId));
        
        // Upgrade new principal
        if (faculty.getUser() != null) {
            faculty.getUser().setRole(Role.PRINCIPAL);
            userRepository.save(faculty.getUser());
        }

        return toFacultyDto(faculty);
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
            dto.setRole(f.getUser().getRole());
        }
        if (f.getDepartmentEntity() != null) {
            dto.setDepartmentCode(f.getDepartmentEntity().getCode());
            dto.setDepartmentName(f.getDepartmentEntity().getName());
        } else if (f.getDepartment() != null && !f.getDepartment().isBlank()) {
            dto.setDepartmentCode(f.getDepartment().trim());
        }
        return dto;
    }

    private Role resolveFacultyAccountRole(Role requested) {
        if (requested == Role.HOD || requested == Role.PRINCIPAL || requested == Role.FACULTY) {
            return requested;
        }
        return Role.FACULTY;
    }

    // ===================== SUBJECT =====================

    public List<SubjectDto> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(s -> new SubjectDto(s.getId(), s.getName(), s.getCode(), 
                        s.getSubjectType() != null ? s.getSubjectType().name() : "REGULAR"))
                .collect(Collectors.toList());
    }

    public SubjectDto createSubject(SubjectDto dto) {
        Subject subject = new Subject();
        subject.setName(dto.getName());
        subject.setCode(dto.getCode());
        if (dto.getSubjectType() != null) {
            try {
                subject.setSubjectType(SubjectType.valueOf(dto.getSubjectType()));
            } catch (Exception e) {
                subject.setSubjectType(SubjectType.REGULAR);
            }
        }
        subject = subjectRepository.save(subject);
        return new SubjectDto(subject.getId(), subject.getName(), subject.getCode(), 
                subject.getSubjectType() != null ? subject.getSubjectType().name() : "REGULAR");
    }

    public SubjectDto updateSubject(Long id, SubjectDto dto) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found with id: " + id));
        subject.setName(dto.getName());
        subject.setCode(dto.getCode());
        if (dto.getSubjectType() != null) {
            try {
                subject.setSubjectType(SubjectType.valueOf(dto.getSubjectType()));
            } catch (Exception e) {
                // Keep existing or default to REGULAR
            }
        }
        subject = subjectRepository.save(subject);
        return new SubjectDto(subject.getId(), subject.getName(), subject.getCode(), 
                subject.getSubjectType() != null ? subject.getSubjectType().name() : "REGULAR");
    }

    public void deleteSubject(Long id) {
        subjectRepository.deleteById(id);
    }

    // ===================== CLASSES =====================

    public ClassDto toClassDto(CourseClass cc) {
        ClassDto dto = new ClassDto();
        dto.setId(cc.getId());
        dto.setName(cc.getName());
        dto.setDepartment(cc.getDepartment());
        dto.setYearLevel(cc.getYearLevel());
        dto.setProgramType(cc.getProgramType() != null ? cc.getProgramType().name() : null);
        dto.setTimetableUrl(cc.getTimetableUrl());
        dto.setSyllabusUrl(cc.getSyllabusUrl());
        dto.setTimetable(cc.getTimetable());
        if (cc.getCrc() != null) {
            dto.setCrcId(cc.getCrc().getId());
            if (cc.getCrc().getUser() != null) {
                dto.setCrcName(cc.getCrc().getUser().getFirstName() + " " + cc.getCrc().getUser().getLastName());
            }
        }
        return dto;
    }

    public List<ClassDto> getAllClasses() {
        return courseClassRepository.findAll().stream()
                .map(this::toClassDto)
                .collect(Collectors.toList());
    }

    public ClassDto createClass(Map<String, Object> body) {
        String name = (String) body.get("name");
        String deptCode = (String) body.get("department");
        String ptString = (String) body.get("programType");
        
        System.out.println("DEBUG: Creating class. Name: " + name + ", Dept: " + deptCode + ", Program: " + ptString);

        if (name == null || name.isBlank()) throw new IllegalArgumentException("Class name is required");
        
        // Optional: check for duplicate in same dept/program
        List<CourseClass> existing = courseClassRepository.findAll().stream()
            .filter(c -> c.getName().equalsIgnoreCase(name) && deptCode != null && deptCode.equalsIgnoreCase(c.getDepartment()))
            .collect(Collectors.toList());
        if (!existing.isEmpty()) {
            throw new IllegalStateException("A class with name '" + name + "' already exists in this department.");
        }

        CourseClass cc = new CourseClass();
        cc.setName(name);
        cc.setDepartment(deptCode);
        cc.setYearLevel(body.get("yearLevel") != null ? Integer.parseInt(body.get("yearLevel").toString()) : 1);
        
        if (ptString != null) {
            try {
                cc.setProgramType(ProgramType.valueOf(ptString.toUpperCase()));
            } catch (Exception e) {
                cc.setProgramType(ProgramType.UG);
            }
        } else {
            cc.setProgramType(ProgramType.UG);
        }
        
        return toClassDto(courseClassRepository.save(cc));
    }


    @Transactional
    public void deleteClass(Long id) {
        CourseClass cc = courseClassRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));

        // Check for attendance data via faculty-subject mappings
        List<FacultySubjectMap> classMappings = facultySubjectMapRepository.findByCourseClass_Id(id);
        boolean hasAttendance = classMappings.stream()
                .anyMatch(m -> !attendanceSessionRepository.findByFacultySubjectMap_Id(m.getId()).isEmpty());
        if (hasAttendance) {
            throw new IllegalStateException("Cannot delete class with attendance records. Clear attendance data first.");
        }

        // 1. Clear student mappings
        studentClassMapRepository.deleteByCourseClass_Id(id);

        // 2. Clear faculty mappings
        facultySubjectMapRepository.deleteByCourseClass_Id(id);

        // 3. Clear class itself
        courseClassRepository.delete(cc);
        
        System.out.println("Deleted class: " + cc.getName());
    }

    public ClassDto getClassDetails(Long classId) {
        return toClassDto(courseClassRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found")));
    }

    public CourseClass updateClassDetails(Long classId, Map<String, Object> details) {
        CourseClass cc = courseClassRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));

        if (details.containsKey("timetable"))
            cc.setTimetable((String) details.get("timetable"));
        if (details.containsKey("syllabus"))
            cc.setSyllabus((String) details.get("syllabus"));
        if (details.containsKey("timetableUrl"))
            cc.setTimetableUrl((String) details.get("timetableUrl"));
        if (details.containsKey("syllabusUrl"))
            cc.setSyllabusUrl((String) details.get("syllabusUrl"));
        if (details.containsKey("programType")) {
            String pt = (String) details.get("programType");
            if (pt != null && !pt.isBlank())
                cc.setProgramType(ProgramType.valueOf(pt.toUpperCase()));
        }

        if (details.containsKey("crcId")) {
            Object crcIdObj = details.get("crcId");
            if (crcIdObj != null) {
                Long crcId = Long.valueOf(crcIdObj.toString());
                Faculty faculty = facultyRepository.findById(crcId)
                        .orElseThrow(() -> new IllegalArgumentException("Faculty not found"));
                // Validation: Must teach at least one subject to this class
                boolean teachesClass = facultySubjectMapRepository.existsByFaculty_IdAndCourseClass_Id(crcId, classId);
                if (!teachesClass) {
                    throw new IllegalArgumentException(
                            "Faculty must teach at least one subject to this class to be CRC");
                }
                cc.setCrc(faculty);
            } else {
                cc.setCrc(null);
            }
        }

        return courseClassRepository.save(cc);
    }

    public ClassDto toClassDtoPublic(CourseClass cc) {
        return toClassDto(cc);
    }

    public List<FacultyDto> getFacultyTeachingClass(Long classId) {
        return facultySubjectMapRepository.findByCourseClass_Id(classId).stream()
                .map(FacultySubjectMap::getFaculty)
                .distinct()
                .map(this::toFacultyDto)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getClassSubjectAssignments(Long classId) {
        List<Map<String, Object>> result = new ArrayList<>();

        // Regular subject-faculty mappings
        List<FacultySubjectMap> regularMaps = facultySubjectMapRepository.findByCourseClass_Id(classId);
        for (FacultySubjectMap m : regularMaps) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", m.getId());
            item.put("isLab", false);
            item.put("subjectId", m.getSubject().getId());
            item.put("subjectName", m.getSubject().getName());
            item.put("subjectCode", m.getSubject().getCode());
            item.put("facultyId", m.getFaculty().getId());
            item.put("facultyName", m.getFaculty().getUser().getFirstName() + " " + m.getFaculty().getUser().getLastName());
            item.put("section", m.getSection());
            result.add(item);
        }

        // Lab assignments
        try {
            List<LabFacultyAssignment> labMaps = labFacultyAssignmentRepository.findByCourseClass_IdAndActiveTrue(classId);
            // Group lab assignments by subject to get unique subjects
            Map<Long, List<LabFacultyAssignment>> grouped = labMaps.stream()
                    .collect(Collectors.groupingBy(la -> la.getLabSubject().getId()));

            for (Map.Entry<Long, List<LabFacultyAssignment>> entry : grouped.entrySet()) {
                LabFacultyAssignment first = entry.getValue().get(0);
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", first.getId());
                item.put("isLab", true);
                item.put("subjectId", first.getLabSubject().getId());
                item.put("subjectName", first.getLabSubject().getName());
                item.put("subjectCode", first.getLabSubject().getCode());
                // Collect all faculty names for this lab
                List<String> facultyNames = entry.getValue().stream()
                        .map(la -> la.getFaculty().getUser().getFirstName() + " " + la.getFaculty().getUser().getLastName())
                        .collect(Collectors.toList());
                item.put("facultyName", String.join(", ", facultyNames));
                item.put("section", "LAB");
                result.add(item);
            }
        } catch (Exception e) {
            // ignore lab errors
        }

        return result;
    }

    public List<DepartmentDto> getDepartmentsByProgramType(String programType) {
        ProgramType type = ProgramType.valueOf(programType.toUpperCase());
        List<Department> allDepts = departmentRepository.findAll();
        Set<String> allCodes = allDepts.stream()
                .map(d -> d.getCode().toUpperCase())
                .collect(Collectors.toSet());

        return allDepts.stream()
                .filter(dept -> {
                    String code = dept.getCode().toUpperCase();
                    if (type == ProgramType.UG) {
                        // MCA, MBA and any code starting with MT (M.Tech) should not be in UG
                        if (code.equals("MBA") || code.equals("MCA") || code.startsWith("MT")) {
                            return false;
                        }
                    } else if (type == ProgramType.PG) {
                        // For PG, if we have a specialized "MT" version of a department, 
                        // don't show the base department in the PG list to avoid duplicates.
                        if (!code.startsWith("MT") && !code.equals("MBA") && !code.equals("MCA")) {
                            boolean hasPgSpecificDept = allCodes.stream()
                                    .anyMatch(c -> c.startsWith("MT") && (c.contains(code) || code.contains(c.replace("MT", ""))));
                            if (hasPgSpecificDept) {
                                return false;
                            }
                        }
                    }
                    // Check if department has a program of this type
                    return programRepository.findByDepartmentId(dept.getId()).stream()
                            .anyMatch(p -> p.getType() == type);
                })
                .map(this::toDepartmentDto)
                .collect(Collectors.toList());
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
                dto.setFacultyName(
                        m.getFaculty().getUser().getFirstName() + " " + m.getFaculty().getUser().getLastName());
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

    // ===================== SYSTEM CLEANUP =====================

    @Transactional
    public void wipeAllData() {
        // 1. Clear attendance data
        attendanceRecordRepository.deleteAll();
        manualOverrideLogRepository.deleteAll();
        attendanceSessionRepository.deleteAll();

        // 2. Clear mappings
        studentClassMapRepository.deleteAll();
        facultySubjectMapRepository.deleteAll();
        studentSemesterHistoryRepository.deleteAll();

        // 3. Clear entities (Student, Faculty)
        studentRepository.deleteAll();

        // Before deleting faculty, we must clear HOD references in Department
        departmentRepository.findAll().forEach(dept -> {
            dept.setHod(null);
            departmentRepository.save(dept);
        });
        facultyRepository.deleteAll();

        // 4. Clear academic structure
        programRepository.deleteAll();
        courseClassRepository.deleteAll();
        subjectRepository.deleteAll();
        departmentRepository.deleteAll();
        academicYearRepository.deleteAll();

        // 5. Clear temporary data
        tempUploadDataRepository.deleteAll();

        // 6. Clear Users (except admin)
        List<User> nonAdminUsers = userRepository.findAll().stream()
                .filter(u -> u.getRole() != Role.ADMIN)
                .collect(Collectors.toList());
        userRepository.deleteAll(nonAdminUsers);

        System.out.println("System data wiped successfully. Only admin remains.");
    }


}
