package com.college.smartattendance.util;

import com.college.smartattendance.entity.Department;
import com.college.smartattendance.entity.EmploymentStatus;
import com.college.smartattendance.entity.Faculty;
import com.college.smartattendance.entity.Role;
import com.college.smartattendance.entity.User;
import com.college.smartattendance.entity.CourseClass;
import com.college.smartattendance.entity.Program;
import com.college.smartattendance.entity.ProgramType;
import com.college.smartattendance.repository.DepartmentRepository;
import com.college.smartattendance.repository.FacultyRepository;
import com.college.smartattendance.repository.UserRepository;
import com.college.smartattendance.repository.CourseClassRepository;
import com.college.smartattendance.repository.ProgramRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "false", matchIfMissing = true)
public class SystemInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseClassRepository courseClassRepository;
    private final ProgramRepository programRepository;
    private final PasswordEncoder passwordEncoder;

    public SystemInitializer(UserRepository userRepository, 
                             FacultyRepository facultyRepository,
                             DepartmentRepository departmentRepository,
                             CourseClassRepository courseClassRepository,
                             ProgramRepository programRepository,
                             PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.courseClassRepository = courseClassRepository;
        this.programRepository = programRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        ensureAdminUser();
        ensureHodUsers();
        ensurePrincipalUser();
        ensureClasses();
    }

    private void ensureAdminUser() {
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setFirstName("System");
            admin.setLastName("Admin");
            admin.setEmail("admin@jntua.in");
            admin.setContactNumber("9848011111");
            admin.setFirstLogin(false);
            userRepository.save(admin);
            System.out.println("Default admin user created: admin / admin123");
        }
    }

    private void ensureHodUsers() {
        List<Department> departments = departmentRepository.findAll();
        for (Department dept : departments) {
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
                System.out.println("Created HOD account: " + hodUsername + " / hod123");
            }
        }
    }

    private void ensurePrincipalUser() {
        if (userRepository.findByUsername("principal").isEmpty()) {
            User principalUser = new User();
            principalUser.setUsername("principal");
            principalUser.setPassword(passwordEncoder.encode("principal123")); // default password
            principalUser.setRole(Role.PRINCIPAL);
            principalUser.setFirstName("College");
            principalUser.setLastName("Principal");
            principalUser.setEmail("principal@jntua.in");
            principalUser.setContactNumber("");
            principalUser.setFirstLogin(true);
            principalUser = userRepository.save(principalUser);

            Faculty principalFaculty = new Faculty();
            principalFaculty.setUser(principalUser);
            principalFaculty.setFacultyId("PRINCIPAL");
            principalFaculty.setDepartment("ALL"); // Principal has access to all departments
            principalFaculty.setEmploymentStatus(EmploymentStatus.ACTIVE);
            principalFaculty.setDesignation("Principal");

            facultyRepository.save(principalFaculty);
            System.out.println("Created Principal account: principal / principal123");
        }
    }

    private void ensureClasses() {
        List<Department> departments = departmentRepository.findAll();
        for (Department dept : departments) {
            String deptCode = dept.getCode();
            boolean isPgOnly = deptCode.equalsIgnoreCase("MBA") || deptCode.equalsIgnoreCase("MCA") || deptCode.toUpperCase().startsWith("MT");

            // Add UG Classes (B.Tech 1st to 4th year)
            if (!isPgOnly) {
                for (int year = 1; year <= 4; year++) {
                    String className = "B.Tech " + year + getOrdinal(year) + " Year";
                    createClassIfNotExists(className, deptCode, year, ProgramType.UG);
                }
            }

            // Add PG Classes (M.Tech 1st to 2nd year)
            for (int year = 1; year <= 2; year++) {
                String className = "M.Tech " + year + getOrdinal(year) + " Year";
                createClassIfNotExists(className, deptCode, year, ProgramType.PG);
            }
            
            // For CSE PG, also add MCA
            if ("CSE".equalsIgnoreCase(deptCode)) {
                for (int year = 1; year <= 2; year++) {
                    String className = "MCA " + year + getOrdinal(year) + " Year";
                    createClassIfNotExists(className, deptCode, year, ProgramType.PG);
                }
            }
        }
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
            System.out.println("Created missing class: " + name + " for department " + deptCode);
        }
    }
}
