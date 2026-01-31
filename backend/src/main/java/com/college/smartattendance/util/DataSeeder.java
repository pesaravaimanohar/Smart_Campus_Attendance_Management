package com.college.smartattendance.util;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AcademicYearRepository academicYearRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private FacultyRepository facultyRepository;
    @Autowired
    private CourseClassRepository courseClassRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private FacultySubjectMapRepository facultySubjectMapRepository;
    @Autowired
    private StudentClassMapRepository studentClassMapRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Academic Year
        AcademicYear year = academicYearRepository.findByActiveTrue().orElse(null);
        if (year == null) {
            year = new AcademicYear();
            year.setName("2025-2026");
            year.setActive(true);
            year = academicYearRepository.save(year);
        }

        // 2. Admin
        if (!userRepository.existsByUsername("admin")) {
            createUser("admin", "admin123", Role.ADMIN, "Super", "Admin");
        }

        // 3. Principal
        if (!userRepository.existsByUsername("PRN001")) {
            createUser("PRN001", "principal123", Role.PRINCIPAL, "Principal", "User");
        }

        // 4. HOD (Also a Faculty)
        if (!userRepository.existsByUsername("HOD001")) {
            User user = createUser("HOD001", "hod123", Role.HOD, "Head", "OfDept");
            createFacultyProfile(user, "Computer Science", "HOD");
        }

        // 5. Faculty
        if (!userRepository.existsByUsername("FAC001")) {
            User user = createUser("FAC001", "faculty123", Role.FACULTY, "John", "Doe");
            Faculty faculty = createFacultyProfile(user, "Computer Science", "Assistant Professor");

            // Create Sample Class & Subject
            CourseClass cClass = createClass("CSE-A", "Computer Science", 4);
            Subject subject = createSubject("Java Programming", "CS101");

            // Assign Faculty to Subject
            FacultySubjectMap map = new FacultySubjectMap();
            map.setFaculty(faculty);
            map.setCourseClass(cClass);
            map.setSubject(subject);
            map.setAcademicYear(year);
            if (facultySubjectMapRepository.findAll().isEmpty()) {
                facultySubjectMapRepository.save(map);
            }
        }

        // 6. Student
        if (!userRepository.existsByUsername("219X1A0501")) {
            User user = createUser("219X1A0501", "student123", Role.STUDENT, "Alice", "Smith");
            Student student = new Student();
            student.setUser(user);
            student = studentRepository.save(student);

            // Map Student to Class
            CourseClass cClass = courseClassRepository.findAll().stream().findFirst().orElse(null);
            if (cClass != null) {
                StudentClassMap map = new StudentClassMap();
                map.setStudent(student);
                map.setCourseClass(cClass);
                map.setAcademicYear(year);
                if (studentClassMapRepository.findAll().isEmpty()) {
                    studentClassMapRepository.save(map);
                }
            }
        }
    }

    private User createUser(String username, String password, Role role, String fname, String lname) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setFirstName(fname);
        user.setLastName(lname);
        user.setFirstLogin(false); // verification skipped for samples
        return userRepository.save(user);
    }

    private Faculty createFacultyProfile(User user, String dept, String designation) {
        Faculty faculty = new Faculty();
        faculty.setUser(user);
        faculty.setDepartment(dept);
        faculty.setDesignation(designation);
        return facultyRepository.save(faculty);
    }

    private CourseClass createClass(String name, String dept, int year) {
        return courseClassRepository.findAll().stream()
                .filter(c -> c.getName().equals(name))
                .findFirst()
                .orElseGet(() -> {
                    CourseClass c = new CourseClass();
                    c.setName(name);
                    c.setDepartment(dept);
                    c.setYearLevel(year);
                    return courseClassRepository.save(c);
                });
    }

    private Subject createSubject(String name, String code) {
        return subjectRepository.findAll().stream()
                .filter(s -> s.getCode().equals(code))
                .findFirst()
                .orElseGet(() -> {
                    Subject s = new Subject();
                    s.setName(name);
                    s.setCode(code);
                    return subjectRepository.save(s);
                });
    }
}
