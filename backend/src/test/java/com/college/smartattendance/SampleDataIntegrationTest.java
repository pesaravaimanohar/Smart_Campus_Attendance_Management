package com.college.smartattendance;

import com.college.smartattendance.entity.AcademicYear;
import com.college.smartattendance.entity.Department;
import com.college.smartattendance.repository.AcademicYearRepository;
import com.college.smartattendance.repository.DepartmentRepository;
import com.college.smartattendance.repository.FacultyRepository;
import com.college.smartattendance.repository.StudentRepository;
import com.college.smartattendance.repository.SubjectRepository;
import com.college.smartattendance.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class SampleDataIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private AcademicYearRepository academicYearRepository;

    @Test
    void sampleDataIsSeededForDemoLoginsAndDashboardViews() {
        assertThat(userRepository.findByUsername("admin")).isPresent();
        assertThat(userRepository.findByUsername("PRN001")).isPresent();
        assertThat(userRepository.findByUsername("HOD001")).isPresent();
        assertThat(userRepository.findByUsername("FAC_CSE01")).isPresent();
        assertThat(userRepository.findByUsername("MBA23001")).isPresent();

        assertThat(studentRepository.findAll()).hasSizeGreaterThanOrEqualTo(15);
        assertThat(facultyRepository.findAll()).hasSizeGreaterThanOrEqualTo(12);
        assertThat(subjectRepository.findAll()).hasSizeGreaterThanOrEqualTo(30);
        assertThat(departmentRepository.count()).isGreaterThanOrEqualTo(17);

        Department cse = departmentRepository.findByCode("CSE").orElseThrow();
        assertThat(cse.getHod()).isNotNull();
        assertThat(departmentRepository.findByCode("MTECHCSE")).isPresent();
        assertThat(subjectRepository.findByCodeIgnoreCase("MTECHCSE401")).isPresent();

        AcademicYear activeYear = academicYearRepository.findByActiveTrue().orElseThrow();
        assertThat(activeYear.getName()).isEqualTo("2025-2026");
    }
}
