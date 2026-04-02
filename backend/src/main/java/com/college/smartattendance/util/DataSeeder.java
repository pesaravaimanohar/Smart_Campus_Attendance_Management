package com.college.smartattendance.util;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

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
    private final PasswordEncoder passwordEncoder;

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
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        AcademicYear activeYear = ensureAcademicYear("2025-2026");
        ensureLeadershipAccounts();
        Map<String, Department> departments = ensureDepartments();
        Map<String, CourseClass> classes = ensureClasses(departments);
        Map<String, Subject> subjects = ensureSubjects(departments);
        Map<String, Faculty> faculties = ensureFaculties(departments);
        ensureAssignments(faculties, classes, subjects, activeYear);
        ensureStudents(departments, classes, activeYear);
        writeCredentials();
    }

    private void ensureLeadershipAccounts() {
        ensureUser("admin", "admin123", Role.ADMIN, "System", "Admin", "admin@smartattendance.local");
        ensureUser("PRN001", "principal123", Role.PRINCIPAL, "Priya", "Reddy", "principal@jntua.local");
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
        deptNames.put("CSEAI", "Computer Science & Engineering (AI & ML)");
        deptNames.put("CSEDS", "Computer Science & Engineering (Data Science)");
        deptNames.put("CSECS", "Computer Science & Engineering (Cyber Security)");
        deptNames.put("IT", "Information Technology");
        deptNames.put("ECE", "Electronics & Communication Engineering");
        deptNames.put("EEE", "Electrical & Electronics Engineering");
        deptNames.put("EIE", "Electronics & Instrumentation Engineering");
        deptNames.put("MECH", "Mechanical Engineering");
        deptNames.put("AUTO", "Automobile Engineering");
        deptNames.put("CIVIL", "Civil Engineering");
        deptNames.put("CHEM", "Chemical Engineering");
        deptNames.put("BIOTECH", "Biotechnology Engineering");
        deptNames.put("MET", "Metallurgical & Materials Engineering");
        deptNames.put("MINING", "Mining Engineering");
        deptNames.put("FOOD", "Food Technology");
        deptNames.put("PETRO", "Petroleum Technology");
        deptNames.put("MBA", "Master of Business Administration");
        deptNames.put("MCA", "Master of Computer Applications");
        deptNames.put("MTCSE", "M.Tech Computer Science & Engineering");
        deptNames.put("MTAI", "M.Tech Artificial Intelligence & Machine Learning");
        deptNames.put("MTDS", "M.Tech Data Science");
        deptNames.put("MTCYB", "M.Tech Cyber Security");
        deptNames.put("MTECE", "M.Tech Electronics & Communication Engineering");
        deptNames.put("MTVLSI", "M.Tech VLSI Design");
        deptNames.put("MTEMB", "M.Tech Embedded Systems");
        deptNames.put("MTPWR", "M.Tech Power Systems");
        deptNames.put("MTMECH", "M.Tech Mechanical Engineering");
        deptNames.put("MTTHERM", "M.Tech Thermal Engineering");
        deptNames.put("MTMDES", "M.Tech Machine Design");
        deptNames.put("MTCIVL", "M.Tech Structural Engineering");
        deptNames.put("MTTRAN", "M.Tech Transportation Engineering");
        deptNames.put("MTENV", "M.Tech Environmental Engineering");
        deptNames.put("MTCHEM", "M.Tech Chemical Engineering");
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

    private Map<String, CourseClass> ensureClasses(Map<String, Department> departments) {
        List<CourseClassSpec> specs = List.of(
                new CourseClassSpec("CSE-UG-4", "IV B.Tech CSE-A", "CSE", 4),
                new CourseClassSpec("CSEAI-UG-3", "III B.Tech CSE(AI)-A", "CSEAI", 3),
                new CourseClassSpec("CSEDS-UG-3", "III B.Tech CSE(DS)-A", "CSEDS", 3),
                new CourseClassSpec("CSECS-UG-3", "III B.Tech CSE(CS)-A", "CSECS", 3),
                new CourseClassSpec("ECE-UG-3", "III B.Tech ECE-A", "ECE", 3),
                new CourseClassSpec("EEE-UG-2", "II B.Tech EEE-A", "EEE", 2),
                new CourseClassSpec("EIE-UG-2", "II B.Tech EIE-A", "EIE", 2),
                new CourseClassSpec("MECH-UG-2", "II B.Tech MECH-A", "MECH", 2),
                new CourseClassSpec("AUTO-UG-2", "II B.Tech AUTO-A", "AUTO", 2),
                new CourseClassSpec("CIVIL-UG-3", "III B.Tech CIVIL-A", "CIVIL", 3),
                new CourseClassSpec("CHEM-UG-1", "I B.Tech CHEM-A", "CHEM", 1),
                new CourseClassSpec("IT-UG-2", "II B.Tech IT-A", "IT", 2),
                new CourseClassSpec("BIOTECH-UG-1", "I B.Tech BIOTECH-A", "BIOTECH", 1),
                new CourseClassSpec("MET-UG-3", "III B.Tech MET-A", "MET", 3),
                new CourseClassSpec("MINING-UG-3", "III B.Tech MINING-A", "MINING", 3),
                new CourseClassSpec("FOOD-UG-2", "II B.Tech FOOD-A", "FOOD", 2),
                new CourseClassSpec("PETRO-UG-2", "II B.Tech PETRO-A", "PETRO", 2),
                new CourseClassSpec("MTCSE-PG-1", "I M.Tech CSE", "MTCSE", 1),
                new CourseClassSpec("MTAI-PG-1", "I M.Tech AI & ML", "MTAI", 1),
                new CourseClassSpec("MTDS-PG-1", "I M.Tech Data Science", "MTDS", 1),
                new CourseClassSpec("MTCYB-PG-1", "I M.Tech Cyber Security", "MTCYB", 1),
                new CourseClassSpec("MTECE-PG-1", "I M.Tech ECE", "MTECE", 1),
                new CourseClassSpec("MTVLSI-PG-1", "I M.Tech VLSI", "MTVLSI", 1),
                new CourseClassSpec("MTEMB-PG-1", "I M.Tech Embedded", "MTEMB", 1),
                new CourseClassSpec("MTPWR-PG-1", "I M.Tech Power Systems", "MTPWR", 1),
                new CourseClassSpec("MTMECH-PG-1", "I M.Tech MECH", "MTMECH", 1),
                new CourseClassSpec("MTTHERM-PG-1", "I M.Tech Thermal", "MTTHERM", 1),
                new CourseClassSpec("MTMDES-PG-1", "I M.Tech Machine Design", "MTMDES", 1),
                new CourseClassSpec("MTCIVL-PG-1", "I M.Tech CIVIL", "MTCIVL", 1),
                new CourseClassSpec("MTTRAN-PG-1", "I M.Tech Transportation", "MTTRAN", 1),
                new CourseClassSpec("MTENV-PG-1", "I M.Tech Environmental", "MTENV", 1),
                new CourseClassSpec("MTCHEM-PG-1", "I M.Tech CHEM", "MTCHEM", 1),
                new CourseClassSpec("MBA-PG-1", "I MBA", "MBA", 1),
                new CourseClassSpec("MCA-PG-1", "I MCA", "MCA", 1)
        );
        Map<String, CourseClass> result = new LinkedHashMap<>();
        specs.forEach(spec -> result.put(spec.key, ensureClass(spec.name, spec.departmentCode, spec.yearLevel)));
        return result;
    }

    private CourseClass ensureClass(String name, String department, int yearLevel) {
        return courseClassRepository.findAll().stream()
                .filter(c -> c.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> {
                    CourseClass c = new CourseClass();
                    c.setName(name);
                    c.setDepartment(department);
                    c.setYearLevel(yearLevel);
                    return courseClassRepository.save(c);
                });
    }

    private Map<String, Subject> ensureSubjects(Map<String, Department> departments) {
        List<SubjectSpec> subjects = List.of(
                new SubjectSpec("Python Programming", "CSE101", "CSE"),
                new SubjectSpec("Data Structures & Algorithms", "CSE102", "CSE"),
                new SubjectSpec("Artificial Intelligence", "CSEAI201", "CSEAI"),
                new SubjectSpec("Data Science Foundations", "CSEDS201", "CSEDS"),
                new SubjectSpec("Network Security", "CSECS201", "CSECS"),
                new SubjectSpec("Embedded Systems", "ECE101", "ECE"),
                new SubjectSpec("Digital Signal Processing", "ECE102", "ECE"),
                new SubjectSpec("Power Systems", "EEE101", "EEE"),
                new SubjectSpec("Control Systems", "EEE102", "EEE"),
                new SubjectSpec("Microcontrollers & Sensors", "EIE201", "EIE"),
                new SubjectSpec("Mechanics of Materials", "MECH101", "MECH"),
                new SubjectSpec("Thermodynamics", "MECH102", "MECH"),
                new SubjectSpec("Automotive Systems", "AUTO201", "AUTO"),
                new SubjectSpec("Structural Concrete Design", "CIVIL101", "CIVIL"),
                new SubjectSpec("Surveying", "CIVIL102", "CIVIL"),
                new SubjectSpec("Process Calculations", "CHEM101", "CHEM"),
                new SubjectSpec("Chemical Reaction Engineering", "CHEM102", "CHEM"),
                new SubjectSpec("Food Processing", "FOOD201", "FOOD"),
                new SubjectSpec("Petroleum Geology", "PETRO201", "PETRO"),
                new SubjectSpec("Database Systems", "IT101", "IT"),
                new SubjectSpec("Software Engineering", "IT102", "IT"),
                new SubjectSpec("Instrumentation Engineering", "EIE101", "EIE"),
                new SubjectSpec("Sensors and Transducers", "EIE102", "EIE"),
                new SubjectSpec("Bioprocess Engineering", "BIOTECH101", "BIOTECH"),
                new SubjectSpec("Genetics and Cell Biology", "BIOTECH102", "BIOTECH"),
                new SubjectSpec("Metallurgical Thermodynamics", "MET101", "MET"),
                new SubjectSpec("Manufacturing Technology", "MET102", "MET"),
                new SubjectSpec("Mine Environmental Engineering", "MINING101", "MINING"),
                new SubjectSpec("Rock Mechanics", "MINING102", "MINING"),
                new SubjectSpec("Business Strategy", "MBA101", "MBA"),
                new SubjectSpec("Organizational Behavior", "MBA102", "MBA"),
                new SubjectSpec("Advanced Algorithms", "MCA201", "MCA"),
                new SubjectSpec("Computer Networks", "MCA202", "MCA"),
                new SubjectSpec("Machine Learning for Engineers", "MTCSE401", "MTCSE"),
                new SubjectSpec("Cybersecurity in Distributed Systems", "MTCSE402", "MTCSE"),
                new SubjectSpec("Deep Learning", "MTAI401", "MTAI"),
                new SubjectSpec("Big Data Systems", "MTDS401", "MTDS"),
                new SubjectSpec("Advanced Cyber Security", "MTCYB401", "MTCYB"),
                new SubjectSpec("VLSI Design", "MTECE401", "MTECE"),
                new SubjectSpec("Advanced Communication Systems", "MTECE402", "MTECE"),
                new SubjectSpec("VLSI Architectures", "MTVLSI401", "MTVLSI"),
                new SubjectSpec("Embedded Real-Time Systems", "MTEMB401", "MTEMB"),
                new SubjectSpec("Power System Protection", "MTPWR401", "MTPWR"),
                new SubjectSpec("Advanced Thermal Engineering", "MTMECH401", "MTMECH"),
                new SubjectSpec("Thermal Systems Design", "MTTHERM401", "MTTHERM"),
                new SubjectSpec("Machine Design", "MTMDES401", "MTMDES"),
                new SubjectSpec("Finite Element Methods", "MTCIVL401", "MTCIVL"),
                new SubjectSpec("Transportation Planning", "MTTRAN401", "MTTRAN"),
                new SubjectSpec("Environmental Impact Assessment", "MTENV401", "MTENV"),
                new SubjectSpec("Advanced Separation Processes", "MTCHEM401", "MTCHEM")
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
                new FacultySpec("HOD001", "hod123", Role.HOD, "Haritha", "Reddy", "hod.cse@jntua.local", "CSE", "Head of Department"),
                new FacultySpec("FAC_CSE01", "faculty123", Role.FACULTY, "Ravi", "Kumar", "ravi.kumar@jntua.local", "CSE", "Associate Professor"),
                new FacultySpec("FAC_CSEAI01", "faculty123", Role.FACULTY, "Harini", "Dev", "harini.dev@jntua.local", "CSEAI", "Assistant Professor"),
                new FacultySpec("FAC_CSEDS01", "faculty123", Role.FACULTY, "Roshan", "Iyer", "roshan.iyer@jntua.local", "CSEDS", "Assistant Professor"),
                new FacultySpec("FAC_CSECS01", "faculty123", Role.FACULTY, "Salim", "Khan", "salim.khan@jntua.local", "CSECS", "Assistant Professor"),
                new FacultySpec("FAC_ECE01", "faculty123", Role.FACULTY, "Sneha", "Varma", "sneha.varma@jntua.local", "ECE", "Associate Professor"),
                new FacultySpec("FAC_EEE01", "faculty123", Role.FACULTY, "Aditya", "Kumar", "aditya.kumar@jntua.local", "EEE", "Assistant Professor"),
                new FacultySpec("FAC_MECH01", "faculty123", Role.FACULTY, "Nithya", "Balaji", "nithya.balaji@jntua.local", "MECH", "Assistant Professor"),
                new FacultySpec("FAC_AUTO01", "faculty123", Role.FACULTY, "Mahesh", "Rao", "mahesh.rao@jntua.local", "AUTO", "Assistant Professor"),
                new FacultySpec("FAC_CIVIL01", "faculty123", Role.FACULTY, "Kavya", "Sharma", "kavya.sharma@jntua.local", "CIVIL", "Assistant Professor"),
                new FacultySpec("FAC_CHEM01", "faculty123", Role.FACULTY, "Siam", "Gowda", "siam@jntua.local", "CHEM", "Assistant Professor"),
                new FacultySpec("FAC_IT01", "faculty123", Role.FACULTY, "Teja", "Reddy", "teja.reddy@jntua.local", "IT", "Assistant Professor"),
                new FacultySpec("FAC_EIE01", "faculty123", Role.FACULTY, "Vijay", "Das", "vijay.das@jntua.local", "EIE", "Associate Professor"),
                new FacultySpec("FAC_BIO01", "faculty123", Role.FACULTY, "Meera", "Nair", "meera.nair@jntua.local", "BIOTECH", "Assistant Professor"),
                new FacultySpec("FAC_MET01", "faculty123", Role.FACULTY, "Suresh", "Kumar", "suresh.kumar@jntua.local", "MET", "Assistant Professor"),
                new FacultySpec("FAC_MINING01", "faculty123", Role.FACULTY, "Shalini", "Chandra", "shalini.chandra@jntua.local", "MINING", "Assistant Professor"),
                new FacultySpec("FAC_FOOD01", "faculty123", Role.FACULTY, "Krupa", "Menon", "krupa.menon@jntua.local", "FOOD", "Assistant Professor"),
                new FacultySpec("FAC_PETRO01", "faculty123", Role.FACULTY, "Sadiq", "Basha", "sadiq.basha@jntua.local", "PETRO", "Assistant Professor"),
                new FacultySpec("FAC_MBA01", "faculty123", Role.FACULTY, "Rohit", "Bhat", "rohit.bhat@jntua.local", "MBA", "Professor"),
                new FacultySpec("FAC_MCA01", "faculty123", Role.FACULTY, "Anjali", "Menon", "anjali.menon@jntua.local", "MCA", "Assistant Professor"),
                new FacultySpec("FAC_MTMECH01", "faculty123", Role.FACULTY, "Hari", "Prasad", "hari.prasad@jntua.local", "MTMECH", "Associate Professor")
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
        User user = ensureUser(spec.username, spec.password, spec.role, spec.firstName, spec.lastName, spec.email);
        return facultyRepository.findByUser(user)
                .map(existing -> updateFaculty(existing, spec, department))
                .orElseGet(() -> {
                    Faculty faculty = new Faculty();
                    faculty.setUser(user);
                    faculty.setFacultyId(spec.username);
                    faculty.setDepartment(department.getCode());
                    faculty.setDepartmentEntity(department);
                    faculty.setDesignation(spec.designation);
                    faculty.setQualifications("M.Tech");
                    faculty.setEmploymentStatus(EmploymentStatus.ACTIVE);
                    return facultyRepository.save(faculty);
                });
    }

    private Faculty updateFaculty(Faculty faculty, FacultySpec spec, Department department) {
        faculty.setFacultyId(spec.username);
        faculty.setDepartment(department.getCode());
        faculty.setDepartmentEntity(department);
        faculty.setDesignation(spec.designation);
        faculty.setEmploymentStatus(EmploymentStatus.ACTIVE);
        return facultyRepository.save(faculty);
    }

    private void ensureAssignments(Map<String, Faculty> faculties, Map<String, CourseClass> classes, Map<String, Subject> subjects, AcademicYear year) {
        List<AssignmentSpec> assignments = List.of(
                new AssignmentSpec("FAC_CSE01", "CSE101", "CSE-UG-4", "A"),
                new AssignmentSpec("FAC_CSE01", "MTCSE401", "MTCSE-PG-1", "A"),
                new AssignmentSpec("FAC_CSEAI01", "CSEAI201", "CSEAI-UG-3", "A"),
                new AssignmentSpec("FAC_CSEDS01", "CSEDS201", "CSEDS-UG-3", "A"),
                new AssignmentSpec("FAC_CSECS01", "CSECS201", "CSECS-UG-3", "A"),
                new AssignmentSpec("FAC_ECE01", "ECE101", "ECE-UG-3", "A"),
                new AssignmentSpec("FAC_EEE01", "EEE101", "EEE-UG-2", "A"),
                new AssignmentSpec("FAC_EIE01", "EIE201", "EIE-UG-2", "A"),
                new AssignmentSpec("FAC_MECH01", "MECH101", "MECH-UG-2", "A"),
                new AssignmentSpec("FAC_AUTO01", "AUTO201", "AUTO-UG-2", "A"),
                new AssignmentSpec("FAC_CIVIL01", "CIVIL101", "CIVIL-UG-3", "A"),
                new AssignmentSpec("FAC_IT01", "IT101", "IT-UG-2", "A"),
                new AssignmentSpec("FAC_FOOD01", "FOOD201", "FOOD-UG-2", "A"),
                new AssignmentSpec("FAC_PETRO01", "PETRO201", "PETRO-UG-2", "A"),
                new AssignmentSpec("FAC_MBA01", "MBA101", "MBA-PG-1", "A"),
                new AssignmentSpec("FAC_MCA01", "MCA201", "MCA-PG-1", "A"),
                new AssignmentSpec("FAC_MTMECH01", "MTMECH401", "MTMECH-PG-1", "A"),
                new AssignmentSpec("FAC_MTMECH01", "MTTHERM401", "MTTHERM-PG-1", "A")
        );
        assignments.forEach(spec -> ensureFacultyAssignment(
                faculties.get(spec.facultyUsername),
                subjects.get(spec.subjectCode),
                classes.get(spec.classKey),
                year,
                spec.section));
    }

    private void ensureStudents(Map<String, Department> departments, Map<String, CourseClass> classes, AcademicYear year) {
        List<StudentSpec> students = List.of(
                new StudentSpec("22X1A0501", "student123", "Saanvi", "Reddy", "CSE", classes.get("CSE-UG-4"), ProgramType.UG, 4, "A", 2021),
                new StudentSpec("23X1A05AI1", "student123", "Dev", "Chakra", "CSEAI", classes.get("CSEAI-UG-3"), ProgramType.UG, 3, "A", 2022),
                new StudentSpec("23X1A05DS2", "student123", "Nidhi", "Kapoor", "CSEDS", classes.get("CSEDS-UG-3"), ProgramType.UG, 3, "A", 2022),
                new StudentSpec("23X1A05CS3", "student123", "Yash", "Mitra", "CSECS", classes.get("CSECS-UG-3"), ProgramType.UG, 3, "A", 2022),
                new StudentSpec("23X1A0502", "student123", "Arjun", "Naik", "ECE", classes.get("ECE-UG-3"), ProgramType.UG, 3, "A", 2022),
                new StudentSpec("24X1A0303", "student123", "Meghana", "Sai", "EEE", classes.get("EEE-UG-2"), ProgramType.UG, 2, "A", 2023),
                new StudentSpec("24X1A0311", "student123", "Keerthana", "Das", "EIE", classes.get("EIE-UG-2"), ProgramType.UG, 2, "A", 2023),
                new StudentSpec("24X1A0404", "student123", "Kiran", "Teja", "MECH", classes.get("MECH-UG-2"), ProgramType.UG, 2, "B", 2023),
                new StudentSpec("24X1A0409", "student123", "Abdul", "Saleem", "AUTO", classes.get("AUTO-UG-2"), ProgramType.UG, 2, "A", 2023),
                new StudentSpec("23X1A0401", "student123", "Ritika", "Sharma", "CIVIL", classes.get("CIVIL-UG-3"), ProgramType.UG, 3, "A", 2022),
                new StudentSpec("25X1A0101", "student123", "Bhavya", "Joshi", "CHEM", classes.get("CHEM-UG-1"), ProgramType.UG, 1, "A", 2024),
                new StudentSpec("24X1A0601", "student123", "Pranav", "Kumar", "IT", classes.get("IT-UG-2"), ProgramType.UG, 2, "A", 2023),
                new StudentSpec("24X1A0701", "student123", "Priya", "Chandra", "EIE", classes.get("EIE-UG-2"), ProgramType.UG, 2, "B", 2023),
                new StudentSpec("25X1A0801", "student123", "Nikhil", "Reddy", "BIOTECH", classes.get("BIOTECH-UG-1"), ProgramType.UG, 1, "A", 2024),
                new StudentSpec("23X1A0901", "student123", "Shreya", "Das", "MET", classes.get("MET-UG-3"), ProgramType.UG, 3, "A", 2022),
                new StudentSpec("23X1A1001", "student123", "Sohan", "Paul", "MINING", classes.get("MINING-UG-3"), ProgramType.UG, 3, "A", 2022),
                new StudentSpec("24X1A1101", "student123", "Nayana", "M", "FOOD", classes.get("FOOD-UG-2"), ProgramType.UG, 2, "A", 2023),
                new StudentSpec("24X1A1201", "student123", "Tarun", "Kashyap", "PETRO", classes.get("PETRO-UG-2"), ProgramType.UG, 2, "A", 2023),
                new StudentSpec("P23CSE001", "student123", "Varun", "Rao", "MTCSE", classes.get("MTCSE-PG-1"), ProgramType.PG, 1, "A", 2023),
                new StudentSpec("P23AI001", "student123", "Lavanya", "Shetty", "MTAI", classes.get("MTAI-PG-1"), ProgramType.PG, 1, "A", 2023),
                new StudentSpec("P23DS001", "student123", "Sridhar", "Kulkarni", "MTDS", classes.get("MTDS-PG-1"), ProgramType.PG, 1, "A", 2023),
                new StudentSpec("P23CYB001", "student123", "Isha", "Ahmed", "MTCYB", classes.get("MTCYB-PG-1"), ProgramType.PG, 1, "A", 2023),
                new StudentSpec("P23ECE001", "student123", "Lakshmi", "Sharma", "MTECE", classes.get("MTECE-PG-1"), ProgramType.PG, 1, "A", 2023),
                new StudentSpec("P23VLSI001", "student123", "Rohini", "Das", "MTVLSI", classes.get("MTVLSI-PG-1"), ProgramType.PG, 1, "A", 2023),
                new StudentSpec("P23EMB001", "student123", "Mohan", "Raj", "MTEMB", classes.get("MTEMB-PG-1"), ProgramType.PG, 1, "A", 2023),
                new StudentSpec("P23PWR001", "student123", "Sai", "Prakash", "MTPWR", classes.get("MTPWR-PG-1"), ProgramType.PG, 1, "A", 2023),
                new StudentSpec("MBA23001", "student123", "Karthik", "Nair", "MBA", classes.get("MBA-PG-1"), ProgramType.PG, 1, "A", 2023),
                new StudentSpec("MCA23001", "student123", "Divya", "Menon", "MCA", classes.get("MCA-PG-1"), ProgramType.PG, 1, "A", 2023),
                new StudentSpec("P23MECH001", "student123", "Rahul", "Krishna", "MTMECH", classes.get("MTMECH-PG-1"), ProgramType.PG, 1, "A", 2023)
        );
        students.forEach(spec -> ensureStudent(spec, departments.get(spec.deptCode), year));
    }

    private void ensureFacultyAssignment(Faculty faculty, Subject subject, CourseClass courseClass, AcademicYear year, String section) {
        if (faculty == null || subject == null || courseClass == null) return;
        facultySubjectMapRepository.findByFacultyAndAcademicYear(faculty, year).stream()
                .filter(existing -> existing.getSubject().equals(subject) && existing.getCourseClass().equals(courseClass))
                .findAny()
                .orElseGet(() -> {
                    FacultySubjectMap map = new FacultySubjectMap();
                    map.setFaculty(faculty);
                    map.setSubject(subject);
                    map.setCourseClass(courseClass);
                    map.setAcademicYear(year);
                    map.setSection(section);
                    map.setLocked(false);
                    return facultySubjectMapRepository.save(map);
                });
    }

    private void ensureStudent(StudentSpec spec, Department department, AcademicYear year) {
        if (department == null) return;
        User user = ensureUser(spec.username, spec.password, Role.STUDENT, spec.firstName, spec.lastName, spec.email);
        Student student = studentRepository.findByUser(user)
                .map(existing -> updateStudent(existing, spec, department))
                .orElseGet(() -> {
                    Student created = new Student();
                    created.setUser(user);
                    created.setRollNumber(spec.username);
                    created.setStudentId(spec.username);
                    created.setDepartment(department.getCode());
                    created.setDepartmentEntity(department);
                    created.setProgram(spec.program);
                    created.setCurrentSemester(spec.currentSemester);
                    created.setSection(spec.section);
                    created.setAdmissionYear(spec.admissionYear);
                    created.setStatus(StudentStatus.ACTIVE);
                    return studentRepository.save(created);
                });

        if (spec.courseClass != null) {
            studentClassMapRepository.findByStudentAndAcademicYear(student, year)
                    .orElseGet(() -> {
                        StudentClassMap map = new StudentClassMap();
                        map.setStudent(student);
                        map.setCourseClass(spec.courseClass);
                        map.setAcademicYear(year);
                        return studentClassMapRepository.save(map);
                    });
        }
    }

    private Student updateStudent(Student student, StudentSpec spec, Department department) {
        student.setRollNumber(spec.username);
        student.setStudentId(spec.username);
        student.setDepartment(department.getCode());
        student.setDepartmentEntity(department);
        student.setProgram(spec.program);
        student.setCurrentSemester(spec.currentSemester);
        student.setSection(spec.section);
        student.setAdmissionYear(spec.admissionYear);
        student.setStatus(StudentStatus.ACTIVE);
        return studentRepository.save(student);
    }

    private User ensureUser(String username, String password, Role role, String firstName, String lastName, String email) {
        return userRepository.findByUsername(username)
                .map(existing -> {
                    recordCredential(role.name(), username, password);
                    return existing;
                })
                .orElseGet(() -> {
                    User user = new User();
                    user.setUsername(username);
                    user.setPassword(passwordEncoder.encode(password));
                    user.setRole(role);
                    user.setFirstName(firstName);
                    user.setLastName(lastName);
                    user.setEmail(email);
                    user.setFirstLogin(false);
                    User saved = userRepository.save(user);
                    recordCredential(role.name(), username, password);
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

        FacultySpec(String username, String password, Role role, String firstName, String lastName, String email, String departmentCode, String designation) {
            this.username = username;
            this.password = password;
            this.role = role;
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.departmentCode = departmentCode;
            this.designation = designation;
        }
    }

    private static class StudentSpec {
        final String username;
        final String password;
        final String firstName;
        final String lastName;
        final String deptCode;
        final String email;
        final CourseClass courseClass;
        final ProgramType program;
        final int currentSemester;
        final String section;
        final int admissionYear;

        StudentSpec(String username, String password, String firstName, String lastName, String deptCode, CourseClass courseClass, ProgramType program, int currentSemester, String section, int admissionYear) {
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
            this.email = username.toLowerCase() + "@jntua.local";
        }
    }

    private static class CourseClassSpec {
        final String key;
        final String name;
        final String departmentCode;
        final int yearLevel;

        CourseClassSpec(String key, String name, String departmentCode, int yearLevel) {
            this.key = key;
            this.name = name;
            this.departmentCode = departmentCode;
            this.yearLevel = yearLevel;
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
