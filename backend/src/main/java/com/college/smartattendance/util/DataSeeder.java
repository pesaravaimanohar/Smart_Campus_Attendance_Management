package com.college.smartattendance.util;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AcademicYearRepository academicYearRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final CourseClassRepository courseClassRepository;
    private final SubjectRepository subjectRepository;
    private final FacultySubjectMapRepository facultySubjectMapRepository;
    private final StudentClassMapRepository studentClassMapRepository;
    private final DepartmentRepository departmentRepository;
    private final ProgramRepository programRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.ug-students-per-year:60}")
    private int ugStudentsPerYear;

    @Value("${app.seed.pg-students-per-year:10}")
    private int pgStudentsPerYear;

    @Value("${app.seed.mca-students-per-year:20}")
    private int mcaStudentsPerYear;

    @Value("${app.seed.sessions-per-mapping:35}")
    private int sessionsPerMapping;

    private final Set<String> credentialLines = new LinkedHashSet<>();

    public DataSeeder(
            UserRepository userRepository,
            AcademicYearRepository academicYearRepository,
            StudentRepository studentRepository,
            FacultyRepository facultyRepository,
            CourseClassRepository courseClassRepository,
            SubjectRepository subjectRepository,
            FacultySubjectMapRepository facultySubjectMapRepository,
            StudentClassMapRepository studentClassMapRepository,
            DepartmentRepository departmentRepository,
            ProgramRepository programRepository,
            AttendanceSessionRepository attendanceSessionRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.academicYearRepository = academicYearRepository;
        this.studentRepository = studentRepository;
        this.facultyRepository = facultyRepository;
        this.courseClassRepository = courseClassRepository;
        this.subjectRepository = subjectRepository;
        this.facultySubjectMapRepository = facultySubjectMapRepository;
        this.studentClassMapRepository = studentClassMapRepository;
        this.departmentRepository = departmentRepository;
        this.programRepository = programRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        System.out.println("============== DATA SEEDER RUNNING ============");
        try {
            AcademicYear activeYear = ensureAcademicYear("2025-2026");
            ensureLeadershipAccounts();
            Map<String, Department> departments = ensureDepartments();
            Map<String, Program> programs = ensurePrograms(departments);
            Map<String, CourseClass> classes = ensureClasses(departments);
            Map<String, Subject> subjects = ensureSubjects(departments);
            Map<String, Faculty> faculties = ensureFaculties(departments);
            ensureAssignments(faculties, classes, subjects, activeYear);
            ensureStudents(departments, classes, activeYear, programs);
            ensureAttendanceData(activeYear);
            writeCredentials();
            System.out.println("============== DATA SEEDER COMPLETED ============");
        } catch (Exception e) {
            System.err.println("============== DATA SEEDER FAILED ============");
            e.printStackTrace();
        }
    }

    private void ensureLeadershipAccounts() {
        ensureUser("admin", "admin123", Role.ADMIN, "System", "Admin", "admin@jntua.in", "9848011111");
        ensureUser("PRN001", "principal123", Role.PRINCIPAL, "P.", "Chenna Reddy Rao", "principal@jntua.in", "9848011112");
    }

    private AcademicYear ensureAcademicYear(String name) {
        return academicYearRepository.findByActiveTrue()
                .orElseGet(() -> {
                    AcademicYear ay = new AcademicYear();
                    ay.setName(name);
                    ay.setActive(true);
                    return academicYearRepository.save(ay);
                });
    }

    private Map<String, Department> ensureDepartments() {
        Map<String, String> deptNames = new LinkedHashMap<>();
        deptNames.put("CSE", "Computer Science & Engineering");
        deptNames.put("ECE", "Electronics & Communication Engineering");
        deptNames.put("EEE", "Electrical & Electronics Engineering");
        deptNames.put("MECH", "Mechanical Engineering");
        deptNames.put("CIVIL", "Civil Engineering");
        deptNames.put("IT", "Information Technology");
        
        Map<String, Department> result = new LinkedHashMap<>();
        deptNames.forEach((code, desc) -> {
            Department dept = departmentRepository.findByCode(code)
                    .orElseGet(() -> {
                        Department d = new Department(code, desc);
                        d.setActive(true);
                        return departmentRepository.save(d);
                    });
            result.put(code, dept);
        });
        return result;
    }
    
    private Map<String, Program> ensurePrograms(Map<String, Department> departments) {
        Map<String, Program> result = new LinkedHashMap<>();
        
        for (Department dept : departments.values()) {
            String code = dept.getCode().toUpperCase();
            boolean isPgOnly = code.equals("MBA") || code.startsWith("MT");

            if (!isPgOnly) {
                Program ug = programRepository.findAll().stream()
                        .filter(p -> p.getName().equals("B.Tech " + dept.getCode()))
                        .findFirst()
                        .orElseGet(() -> {
                            Program p = new Program("B.Tech " + dept.getCode(), ProgramType.UG, 4, 8);
                            p.setDepartment(dept);
                            return programRepository.save(p);
                        });
                result.put(dept.getCode() + "_UG", ug);
            }
            
            String prefix = isPgOnly ? "" : "M.Tech ";
            Program pg = programRepository.findAll().stream()
                    .filter(p -> p.getName().equals(prefix + dept.getCode()))
                    .findFirst()
                    .orElseGet(() -> {
                        Program p = new Program(prefix + dept.getCode(), ProgramType.PG, 2, 4);
                        p.setDepartment(dept);
                        return programRepository.save(p);
                    });
            result.put(dept.getCode() + "_PG", pg);

            if (code.equals("CSE")) {
                Program mca = programRepository.findAll().stream()
                        .filter(p -> p.getName().equals("MCA"))
                        .findFirst()
                        .orElseGet(() -> {
                            Program p = new Program("MCA", ProgramType.PG, 2, 4);
                            p.setDepartment(dept);
                            return programRepository.save(p);
                        });
                result.put(dept.getCode() + "_MCA", mca);
            }
        }
        return result;
    }

    private Map<String, CourseClass> ensureClasses(Map<String, Department> departments) {
        List<CourseClassSpec> specs = new ArrayList<>();
        String[] depts = {"CSE", "ECE", "EEE", "CIVIL", "MECH", "IT"};
        
        for (String dept : depts) {
            // UG Classes
            for (int year = 1; year <= 4; year++) {
                specs.add(new CourseClassSpec(dept + "-UG-" + year + "A", yearString(year) + " B.Tech " + dept + "-A", dept, year, ProgramType.UG));
                specs.add(new CourseClassSpec(dept + "-UG-" + year + "B", yearString(year) + " B.Tech " + dept + "-B", dept, year, ProgramType.UG));
            }
            // PG Classes (M.Tech)
            for (int year = 1; year <= 2; year++) {
                specs.add(new CourseClassSpec(dept + "-PG-" + year, yearString(year) + " M.Tech " + dept, dept, year, ProgramType.PG));
            }
        }

        // Special PG Classes
        for (int year = 1; year <= 2; year++) {
            specs.add(new CourseClassSpec("CSE-MCA-" + year, yearString(year) + " MCA", "CSE", year, ProgramType.PG));
        }

        Map<String, CourseClass> result = new LinkedHashMap<>();
        specs.forEach(spec -> result.put(spec.key, ensureClass(spec.name, spec.departmentCode, spec.yearLevel, spec.type)));
        return result;
    }

    private record CourseClassSpec(String key, String name, String departmentCode, int yearLevel, ProgramType type) {}
    
    private String yearString(int year) {
        switch(year) {
            case 1: return "I";
            case 2: return "II";
            case 3: return "III";
            case 4: return "IV";
            default: return "";
        }
    }

    private CourseClass ensureClass(String name, String department, int yearLevel, ProgramType type) {
        return courseClassRepository.findAll().stream()
                .filter(c -> c.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> {
                    CourseClass c = new CourseClass();
                    c.setName(name);
                    c.setDepartment(department);
                    c.setYearLevel(yearLevel);
                    c.setProgramType(type);
                    return courseClassRepository.save(c);
                });
    }

    private Map<String, Subject> ensureSubjects(Map<String, Department> departments) {
        List<SubjectSpec> subjects = List.of(
                // CSE
                new SubjectSpec("Data Structures and Algorithms", "CSE101", "CSE"),
                new SubjectSpec("Operating Systems", "CSE102", "CSE"),
                new SubjectSpec("Database Management", "CSE103", "CSE"),
                new SubjectSpec("Computer Networks", "CSE104", "CSE"),
                new SubjectSpec("Software Engineering", "CSE105", "CSE"),
                new SubjectSpec("Discrete Mathematics", "CSE106", "CSE"),
                new SubjectSpec("Theory of Computation", "CSE107", "CSE"),
                new SubjectSpec("Artificial Intelligence", "CSE108", "CSE"),
                
                // ECE
                new SubjectSpec("Signals and Systems", "ECE101", "ECE"),
                new SubjectSpec("Digital Electronics", "ECE102", "ECE"),
                new SubjectSpec("Microprocessors", "ECE103", "ECE"),
                new SubjectSpec("Communication Systems", "ECE104", "ECE"),
                new SubjectSpec("Control Systems", "ECE105", "ECE"),
                new SubjectSpec("Electromagnetic Fields", "ECE106", "ECE"),
                new SubjectSpec("VLSI Design", "ECE107", "ECE"),
                new SubjectSpec("Antennas", "ECE108", "ECE"),

                // EEE
                new SubjectSpec("Electrical Machines", "EEE101", "EEE"),
                new SubjectSpec("Power Systems", "EEE102", "EEE"),
                new SubjectSpec("Network Analysis", "EEE103", "EEE"),
                new SubjectSpec("Control Engineering", "EEE104", "EEE"),
                new SubjectSpec("Power Electronics", "EEE105", "EEE"),
                new SubjectSpec("Measurements", "EEE106", "EEE"),
                new SubjectSpec("Switchgear", "EEE107", "EEE"),
                new SubjectSpec("Utilization", "EEE108", "EEE"),

                // MECH
                new SubjectSpec("Thermodynamics", "MECH101", "MECH"),
                new SubjectSpec("Fluid Mechanics", "MECH102", "MECH"),
                new SubjectSpec("Machine Design", "MECH103", "MECH"),
                new SubjectSpec("Manufacturing Tech", "MECH104", "MECH"),
                new SubjectSpec("Heat Transfer", "MECH105", "MECH"),
                new SubjectSpec("Kinematics", "MECH106", "MECH"),
                new SubjectSpec("Dynamics", "MECH107", "MECH"),
                new SubjectSpec("CAD/CAM", "MECH108", "MECH"),

                // CIVIL
                new SubjectSpec("Structural Analysis", "CIVIL101", "CIVIL"),
                new SubjectSpec("Concrete Technology", "CIVIL102", "CIVIL"),
                new SubjectSpec("Surveying", "CIVIL103", "CIVIL"),
                new SubjectSpec("Geotech Eng", "CIVIL104", "CIVIL"),
                new SubjectSpec("Water Resources", "CIVIL105", "CIVIL"),
                new SubjectSpec("Environmental Eng", "CIVIL106", "CIVIL"),
                new SubjectSpec("Transportation Eng", "CIVIL107", "CIVIL"),
                new SubjectSpec("Hydrology", "CIVIL108", "CIVIL"),

                // IT
                new SubjectSpec("Web Technologies", "IT101", "IT"),
                new SubjectSpec("Computer Networks", "IT102", "IT"),
                new SubjectSpec("Java Programming", "IT103", "IT"),
                new SubjectSpec("Cloud Computing", "IT104", "IT"),
                new SubjectSpec("Information Security", "IT105", "IT"),
                new SubjectSpec("Data Warehousing", "IT106", "IT"),
                new SubjectSpec("Mobile App Dev", "IT107", "IT"),
                new SubjectSpec("Distributed Systems", "IT108", "IT")
        );
        Map<String, Subject> result = new LinkedHashMap<>();
        subjects.forEach(spec -> result.put(spec.code, ensureSubject(spec)));
        return result;
    }

    private Subject ensureSubject(SubjectSpec spec) {
        return subjectRepository.findByCodeIgnoreCase(spec.code)
                .orElseGet(() -> {
                    Subject subject = new Subject();
                    subject.setName(spec.name);
                    subject.setCode(spec.code);
                    return subjectRepository.save(subject);
                });
    }

    private Map<String, Faculty> ensureFaculties(Map<String, Department> departments) {
        List<FacultySpec> specs = List.of(
                // HODs
                new FacultySpec("HOD_CSE", "hod123", Role.HOD, "B.", "Sathyanarayana", "hod.cse@jntua.in", "CSE", "Professor and HOD", "9848022334"),
                new FacultySpec("HOD_ECE", "hod123", Role.HOD, "M.", "Murali Krishna", "hod.ece@jntua.in", "ECE", "Professor and HOD", "9848022335"),
                new FacultySpec("HOD_EEE", "hod123", Role.HOD, "V.", "Ramana Murthy", "hod.eee@jntua.in", "EEE", "Professor and HOD", "9848022336"),
                new FacultySpec("HOD_MECH", "hod123", Role.HOD, "K.", "Subba Reddy", "hod.mech@jntua.in", "MECH", "Professor and HOD", "9848022337"),
                new FacultySpec("HOD_CIVIL", "hod123", Role.HOD, "P.", "Siva Kumar", "hod.civil@jntua.in", "CIVIL", "Professor and HOD", "9848022338"),
                new FacultySpec("HOD_IT", "hod123", Role.HOD, "M.", "Vijaya Kumar", "hod.it@jntua.in", "IT", "Professor and HOD", "9848022339"),
                
                // CSE Faculty
                new FacultySpec("FAC_CSE01", "faculty123", Role.FACULTY, "L.", "Raman", "lakshmi.r@jntua.in", "CSE", "Associate Professor", "8142000101"),
                new FacultySpec("FAC_CSE02", "faculty123", Role.FACULTY, "B.", "Sujatha Reddy", "sujatha.r@jntua.in", "CSE", "Assistant Professor", "8142000102"),
                new FacultySpec("FAC_CSE03", "faculty123", Role.FACULTY, "K.", "Praveen", "praveen.k@jntua.in", "CSE", "Assistant Professor", "8142000103"),
                
                // ECE Faculty
                new FacultySpec("FAC_ECE01", "faculty123", Role.FACULTY, "N.", "Gowtham Naidu", "gowtham.n@jntua.in", "ECE", "Associate Professor", "8142000201"),
                new FacultySpec("FAC_ECE02", "faculty123", Role.FACULTY, "A.", "Bhavani Shankar", "bhavani.s@jntua.in", "ECE", "Assistant Professor", "8142000202"),
                
                // EEE Faculty
                new FacultySpec("FAC_EEE01", "faculty123", Role.FACULTY, "T.", "Rama Devi", "rama.d@jntua.in", "EEE", "Associate Professor", "8142000301"),
                new FacultySpec("FAC_EEE02", "faculty123", Role.FACULTY, "M.", "Anand Rao", "anand.r@jntua.in", "EEE", "Assistant Professor", "8142000302"),

                // MECH Faculty
                new FacultySpec("FAC_MECH01", "faculty123", Role.FACULTY, "R.", "Venkata Ramana", "venkata.r@jntua.in", "MECH", "Associate Professor", "8142000401"),
                new FacultySpec("FAC_MECH02", "faculty123", Role.FACULTY, "K.", "Surendra", "surendra.k@jntua.in", "MECH", "Assistant Professor", "8142000402"),
                
                // CIVIL Faculty
                new FacultySpec("FAC_CIVIL01", "faculty123", Role.FACULTY, "G.", "Siva Prasad", "siva.p@jntua.in", "CIVIL", "Assistant Professor", "8142000501"),
                new FacultySpec("FAC_CIVIL02", "faculty123", Role.FACULTY, "K.", "Srinivas", "srinivas.k@jntua.in", "CIVIL", "Assistant Professor", "8142000502"),

                // IT Faculty
                new FacultySpec("FAC_IT01", "faculty123", Role.FACULTY, "M.", "Kalyani Desai", "kalyani.d@jntua.in", "IT", "Assistant Professor", "8142000601"),
                new FacultySpec("FAC_IT02", "faculty123", Role.FACULTY, "D.", "Raju", "raju.d@jntua.in", "IT", "Assistant Professor", "8142000602")
        );
        Map<String, Faculty> result = new LinkedHashMap<>();
        specs.forEach(spec -> {
            Department department = departments.get(spec.departmentCode);
            if (department == null) {
                return;
            }
            Faculty faculty = ensureFaculty(spec, department);
            result.put(spec.username, faculty);
            if (spec.role == Role.HOD) {
                department.setHod(faculty);
                departmentRepository.save(department);
            }
        });
        return result;
    }

    private Faculty ensureFaculty(FacultySpec spec, Department department) {
        String normalizedUsername = spec.username != null ? spec.username.trim().toLowerCase() : "";
        User user = ensureUser(normalizedUsername, spec.password, spec.role, spec.firstName, spec.lastName, spec.email, spec.phone);
        return facultyRepository.findByUser(user)
                .map(existing -> updateFaculty(existing, normalizedUsername, department, spec.designation))
                .orElseGet(() -> {
                    Faculty faculty = new Faculty();
                    faculty.setUser(user);
                    faculty.setFacultyId(normalizedUsername);
                    faculty.setDepartment(department.getCode());
                    faculty.setDepartmentEntity(department);
                    faculty.setDesignation(spec.designation);
                    faculty.setQualifications("M.Tech., Ph.D");
                    faculty.setEmploymentStatus(EmploymentStatus.ACTIVE);
                    return facultyRepository.save(faculty);
                });
    }

    private Faculty updateFaculty(Faculty faculty, String facultyId, Department department, String designation) {
        faculty.setFacultyId(facultyId);
        faculty.setDepartment(department.getCode());
        faculty.setDepartmentEntity(department);
        faculty.setDesignation(designation);
        faculty.setEmploymentStatus(EmploymentStatus.ACTIVE);
        return facultyRepository.save(faculty);
    }

    private void ensureAssignments(Map<String, Faculty> faculties, Map<String, CourseClass> classes, Map<String, Subject> subjects, AcademicYear year) {
        Random rand = new Random(42);
        List<Faculty> facultyList = new ArrayList<>(faculties.values());
        List<Subject> subjectList = new ArrayList<>(subjects.values());
        List<CourseClass> classList = new ArrayList<>(classes.values());

        // Ensure every class has at least 3 subjects assigned
        for (CourseClass cc : classList) {
            List<Subject> deptSubjects = subjectList.stream()
                .filter(s -> s.getCode().startsWith(cc.getDepartment()))
                .collect(Collectors.toList());
            
            if (deptSubjects.isEmpty()) deptSubjects = subjectList; // fallback

            // Assign 6-8 subjects per class
            int subjectsPerClass = 6 + rand.nextInt(3); 
            for (int i = 0; i < Math.min(subjectsPerClass, deptSubjects.size()); i++) {
                Subject s = deptSubjects.get(i);
                // Assign a faculty from the same department
                List<Faculty> deptFaculty = facultyList.stream()
                    .filter(f -> f.getDepartment().equals(cc.getDepartment()))
                    .collect(Collectors.toList());
                
                if (!deptFaculty.isEmpty()) {
                    Faculty f = deptFaculty.get(rand.nextInt(deptFaculty.size()));
                    ensureFacultyAssignment(f, s, cc, year, cc.getName().endsWith("-A") ? "A" : "B");
                }
            }
        }
        
        System.out.println("Assignments completed for all classes.");
    }

    private void ensureStudents(Map<String, Department> departments, Map<String, CourseClass> classes, AcademicYear year, Map<String, Program> programs) {
        String[] firstNames = {"Sai", "Teja", "Karthik", "Ravi", "Venkata", "Suresh", "Ramesh", "Mohan", "Krishna", "Ram", "Siva", "Kiran", "Naveen", "Pavan", "Prashanth", "Harish", "Tarun", "Akhil", "Anil", "Bhanu", "Charan", "Deepak", "Ganesh", "Hemanth", "Jagadish", "Madhav", "Manish", "Nithin", "Phani", "Prakash", "Swetha", "Keerthi", "Bhavana", "Kavya", "Ramya", "Sowmya", "Harika", "Akhila", "Goutami", "Jyothi", "Divya", "Sravani", "Bargavi", "Deepika"};
        String[] lastNames = {"Reddy", "Rao", "Naidu", "Chowdary", "Goud", "Yadav", "Sharma", "Babu", "Kumar", "Varma", "Gowda", "Devi", "Kumari", "Latha", "Rani", "Sri"};
        String[] deptsList = {"05", "04", "02", "03", "01", "12"}; // standard JNTUA branch codes

        List<StudentSpec> students = new ArrayList<>();
        Random rand = new Random(42);
        
        String[] deptCodes = {"CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"};
        
        for (int d = 0; d < deptCodes.length; d++) {
            String dept = deptCodes[d];
            String branchCode = deptsList[d];
            Program ugProgram = programs.get(dept + "_UG");
            Program pgProgram = programs.get(dept + "_PG");
            
            // UG Students (60 per year)
            for (int yearLevel = 1; yearLevel <= 4; yearLevel++) {
                int admissionYear = 2024 - yearLevel + 1;
                String yearStr = String.valueOf(admissionYear).substring(2);
                CourseClass classA = classes.get(dept + "-UG-" + yearLevel + "A");
                CourseClass classB = classes.get(dept + "-UG-" + yearLevel + "B");
                int half = (ugStudentsPerYear + 1) / 2;
                for (int i = 1; i <= ugStudentsPerYear; i++) {
                    String section = (i <= half) ? "A" : "B";
                    CourseClass currentClass = (i <= half) ? classA : classB;
                    String fn = firstNames[rand.nextInt(firstNames.length)];
                    String ln = lastNames[rand.nextInt(lastNames.length)];
                    String rollSuffix = String.format("%02d", (i > half ? i - half : i));
                    String rollNum = yearStr + "X1A" + branchCode + (i > half ? "B" : "0") + rollSuffix;
                    String phone = "9" + String.format("%09d", rand.nextInt(1000000000));
                    int currentSem = (yearLevel - 1) * 2 + 1;
                    students.add(new StudentSpec(rollNum, "student123", fn, ln, dept, currentClass, ugProgram, currentSem, section, admissionYear, phone));
                }
            }

            // PG Students (M.Tech) (10 per year)
            for (int yearLevel = 1; yearLevel <= 2; yearLevel++) {
                int admissionYear = 2024 - yearLevel + 1;
                String yearStr = String.valueOf(admissionYear).substring(2);
                CourseClass pgClass = classes.get(dept + "-PG-" + yearLevel);
                for (int i = 1; i <= pgStudentsPerYear; i++) {
                    String fn = firstNames[rand.nextInt(firstNames.length)];
                    String ln = lastNames[rand.nextInt(lastNames.length)];
                    String rollNum = yearStr + "X1D" + branchCode + String.format("%02d", i);
                    String phone = "9" + String.format("%09d", rand.nextInt(1000000000));
                    int currentSem = (yearLevel - 1) * 2 + 1;
                    students.add(new StudentSpec(rollNum, "student123", fn, ln, dept, pgClass, pgProgram, currentSem, "A", admissionYear, phone));
                }
            }
        }

        // MCA Students (Special Case)
        Program mcaProgram = programs.get("CSE_MCA");
        for (int yearLevel = 1; yearLevel <= 2; yearLevel++) {
            int admissionYear = 2024 - yearLevel + 1;
            String yearStr = String.valueOf(admissionYear).substring(2);
            CourseClass mcaClass = classes.get("CSE-MCA-" + yearLevel);
            for (int i = 1; i <= mcaStudentsPerYear; i++) {
                String fn = firstNames[rand.nextInt(firstNames.length)];
                String ln = lastNames[rand.nextInt(lastNames.length)];
                String rollNum = yearStr + "X1F00" + String.format("%02d", i);
                String phone = "9" + String.format("%09d", rand.nextInt(1000000000));
                int currentSem = (yearLevel - 1) * 2 + 1;
                students.add(new StudentSpec(rollNum, "student123", fn, ln, "CSE", mcaClass, mcaProgram, currentSem, "A", admissionYear, phone));
            }
        }
        
        System.out.println("Seeding " + students.size() + " students...");
        students.forEach(spec -> ensureStudent(spec, departments.get(spec.deptCode), year));
    }

    private void ensureFacultyAssignment(Faculty faculty, Subject subject, CourseClass courseClass, AcademicYear year, String section) {
        if (faculty == null || subject == null || courseClass == null) return;
        boolean exists = facultySubjectMapRepository.findByFacultyAndAcademicYear(faculty, year).stream()
                .anyMatch(existing ->
                        existing.getSubject().getId().equals(subject.getId())
                        && existing.getCourseClass().getId().equals(courseClass.getId())
                        && (existing.getSection() == null || existing.getSection().equals(section)));
        if (!exists) {
            FacultySubjectMap map = new FacultySubjectMap();
            map.setFaculty(faculty);
            map.setSubject(subject);
            map.setCourseClass(courseClass);
            map.setAcademicYear(year);
            map.setSection(section);
            map.setLocked(false);
            facultySubjectMapRepository.save(map);
        }
    }

    private void ensureStudent(StudentSpec spec, Department department, AcademicYear year) {
        if (department == null) return;
        String normalizedUsername = spec.username != null ? spec.username.trim().toLowerCase() : "";
        User user = ensureUser(normalizedUsername, spec.password, Role.STUDENT, spec.firstName, spec.lastName, spec.email, spec.phone);
        Student student = studentRepository.findByUser(user)
                .map(existing -> updateStudent(existing, normalizedUsername, spec, department))
                .orElseGet(() -> {
                    Student created = new Student();
                    created.setUser(user);
                    created.setRollNumber(normalizedUsername);
                    created.setStudentId(normalizedUsername);
                    created.setDepartment(department.getCode());
                    created.setDepartmentEntity(department);
                    created.setProgram(spec.program != null ? spec.program.getType() : ProgramType.UG);
                    created.setCurrentSemester(spec.currentSemester);
                    created.setSection(spec.section);
                    created.setAdmissionYear(spec.admissionYear);
                    created.setStatus(StudentStatus.ACTIVE);
                    return studentRepository.save(created);
                });

        if (spec.courseClass != null) {
             boolean exists = studentClassMapRepository.existsByStudent_IdAndCourseClass_Id(student.getId(), spec.courseClass.getId());
             if (!exists) {
                 StudentClassMap map = new StudentClassMap();
                 map.setStudent(student);
                 map.setCourseClass(spec.courseClass);
                 map.setAcademicYear(year);
                 studentClassMapRepository.save(map);
             }
        }
    }

    private Student updateStudent(Student student, String rollNumber, StudentSpec spec, Department department) {
        student.setRollNumber(rollNumber);
        student.setStudentId(rollNumber);
        student.setDepartment(department.getCode());
        student.setDepartmentEntity(department);
        student.setProgram(spec.program != null ? spec.program.getType() : ProgramType.UG);
        student.setCurrentSemester(spec.currentSemester);
        student.setSection(spec.section);
        student.setAdmissionYear(spec.admissionYear);
        student.setStatus(StudentStatus.ACTIVE);
        return studentRepository.save(student);
    }

    private void ensureAttendanceData(AcademicYear year) {
        if (attendanceSessionRepository.count() > 500) return; // Only seed if empty or relatively low

        List<FacultySubjectMap> mappings = facultySubjectMapRepository.findByAcademicYear(year);
        Random rand = new Random(42);

        System.out.println("Seeding attendance data for " + mappings.size() + " mappings...");

        for (FacultySubjectMap map : mappings) {
            // Create 15-20 sessions per mapping for historical analysis
            // Create 35-45 sessions per mapping (for ~2 months of classes)
            int sessionCount = sessionsPerMapping + (sessionsPerMapping > 1 ? rand.nextInt(11) : 0);
            List<StudentClassMap> classStudents = studentClassMapRepository.findByCourseClass_IdAndAcademicYear_Id(
                    map.getCourseClass().getId(), year.getId());

            // Pre-identify some students as "defaulters" (consistent low attendance)
            Set<Long> defaulterIds = new HashSet<>();
            if (classStudents.size() > 5) {
                int defCount = 3 + rand.nextInt(4);
                for (int d = 0; d < defCount; d++) {
                    defaulterIds.add(classStudents.get(rand.nextInt(classStudents.size())).getStudent().getId());
                }
            }

            for (int i = 0; i < sessionCount; i++) {
                AttendanceSession session = new AttendanceSession();
                session.setFacultySubjectMap(map);
                // Spread sessions over the last 60 days
                session.setStartTime(java.time.LocalDateTime.now()
                    .minusDays(60) 
                    .plusHours(i * (rand.nextInt(20) + 10)) // Random distribution over time
                    .withHour(9 + rand.nextInt(6))
                    .withMinute(0));
                session.setEndTime(session.getStartTime().plusHours(1));
                session.setActive(false);
                session.setLatitude(14.6819);
                session.setLongitude(77.6006);
                session.setRadius(50.0);
                session.setQrToken(UUID.randomUUID().toString());
                session = attendanceSessionRepository.save(session);

                for (StudentClassMap scm : classStudents) {
                    double probability = 0.85 + (rand.nextDouble() * 0.12); // Average 85-97%
                    
                    if (defaulterIds.contains(scm.getStudent().getId())) {
                        probability = 0.4 + (rand.nextDouble() * 0.3); // Defaulter average 40-70%
                    }

                    AttendanceRecord record = new AttendanceRecord();
                    record.setSession(session);
                    record.setStudent(scm.getStudent());
                    record.setTimestamp(session.getStartTime().plusMinutes(5 + rand.nextInt(25)));
                    
                    if (rand.nextDouble() < probability) {
                        record.setStatus(AttendanceStatus.PRESENT);
                    } else {
                        record.setStatus(AttendanceStatus.REJECTED);
                        record.setRemarks("Absent");
                    }
                    attendanceRecordRepository.save(record);
                }
            }
        }
        System.out.println("Attendance data seeding completed.");
    }

    private User ensureUser(String username, String password, Role role, String firstName, String lastName, String email, String phone) {
        String normalizedUsername = username != null ? username.trim().toLowerCase() : "";
        return userRepository.findByUsername(normalizedUsername)
                .map(existing -> {
                    recordCredential(role.name(), normalizedUsername, password);
                    if (existing.getContactNumber() == null || existing.getContactNumber().isEmpty()) {
                        existing.setContactNumber(phone);
                        existing.setFirstName(firstName);
                        existing.setLastName(lastName);
                        userRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    User user = new User();
                    user.setUsername(normalizedUsername);
                    user.setPassword(passwordEncoder.encode(password));
                    user.setRole(role);
                    user.setFirstName(firstName);
                    user.setLastName(lastName);
                    user.setEmail(email != null ? email.trim().toLowerCase() : "");
                    user.setContactNumber(phone);
                    user.setFirstLogin(false);
                    User saved = userRepository.save(user);
                    recordCredential(role.name(), normalizedUsername, password);
                    return saved;
                });
    }

    private void recordCredential(String role, String username, String password) {
        credentialLines.add(String.join(",", role, username, password));
    }

    private void writeCredentials() {
        if (credentialLines.isEmpty()) return;
        Path path = Path.of("seeded-users.txt");
        try {
            Files.write(path, credentialLines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Failed to write seeded credentials: " + e.getMessage());
        }
    }

    private static class SubjectSpec {
        final String name;
        final String code;
        final String departmentCode;

        SubjectSpec(String name, String code, String departmentCode) {
            this.name = name;
            this.code = code;
            this.departmentCode = departmentCode;
        }
    }

    private static class FacultySpec {
        final String username;
        final String password;
        final Role role;
        final String firstName;
        final String lastName;
        final String email;
        final String departmentCode;
        final String designation;
        final String phone;

        FacultySpec(String username, String password, Role role, String firstName, String lastName, String email, String departmentCode, String designation, String phone) {
            this.username = username;
            this.password = password;
            this.role = role;
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.departmentCode = departmentCode;
            this.designation = designation;
            this.phone = phone;
        }
    }

    private static class StudentSpec {
        final String username;
        final String password;
        final String firstName;
        final String lastName;
        final String deptCode;
        final String email;
        final String phone;
        final CourseClass courseClass;
        final Program program;
        final int currentSemester;
        final String section;
        final int admissionYear;

        StudentSpec(String username, String password, String firstName, String lastName, String deptCode, CourseClass courseClass, Program program, int currentSemester, String section, int admissionYear, String phone) {
            this.username = username;
            this.password = password;
            this.firstName = firstName;
            this.lastName = lastName;
            this.deptCode = deptCode;
            this.courseClass = courseClass;
            this.program = program;
            this.currentSemester = currentSemester;
            this.section = section;
            this.admissionYear = admissionYear;
            this.phone = phone;
            this.email = username.toLowerCase() + "@jntua.in";
        }
    }



    private static class AssignmentSpec {
        final String facultyUsername;
        final String subjectCode;
        final String classKey;
        final String section;

        AssignmentSpec(String facultyUsername, String subjectCode, String classKey, String section) {
            this.facultyUsername = facultyUsername;
            this.subjectCode = subjectCode;
            this.classKey = classKey;
            this.section = section;
        }
    }
}
