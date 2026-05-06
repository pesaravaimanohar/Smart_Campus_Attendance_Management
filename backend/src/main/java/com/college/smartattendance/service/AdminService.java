package com.college.smartattendance.service;

import com.college.smartattendance.dto.ClassDto;
import com.college.smartattendance.dto.StatsDto;
import com.college.smartattendance.entity.CourseClass;
import com.college.smartattendance.entity.User;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AdminService {

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceSessionRepository sessionRepository;

    public void resetAllUsersToFirstLogin() {
        List<User> users = userRepository.findAll();
        for (User user : users) {
            user.setFirstLogin(true);
        }
        userRepository.saveAll(users);
    }

    public CourseClass createClass(ClassDto classDto) {
        CourseClass courseClass = new CourseClass();
        courseClass.setName(classDto.getName());
        courseClass.setDepartment(classDto.getDepartment());
        courseClass.setYearLevel(classDto.getYearLevel());
        if (classDto.getProgramType() != null) {
            try {
                courseClass.setProgramType(com.college.smartattendance.entity.ProgramType.valueOf(classDto.getProgramType().toUpperCase()));
            } catch (Exception e) {
                courseClass.setProgramType(com.college.smartattendance.entity.ProgramType.UG);
            }
        } else {
            courseClass.setProgramType(com.college.smartattendance.entity.ProgramType.UG);
        }
        return courseClassRepository.save(courseClass);
    }

    public List<CourseClass> getAllClasses() {
        return courseClassRepository.findAll();
    }

    public void deleteClass(Long id) {
        courseClassRepository.deleteById(id);
    }

    public StatsDto getStats() {
        StatsDto stats = new StatsDto();
        stats.setTotalStudents(studentRepository.count());
        stats.setTotalFaculty(facultyRepository.count());
        stats.setTotalClasses(courseClassRepository.count());
        stats.setTotalSubjects(subjectRepository.count());
        stats.setTotalSessions(sessionRepository.count());

        // Count today's sessions
        LocalDate today = LocalDate.now();
        long todaySessions = sessionRepository.findAll().stream()
                .filter(session -> session.getStartTime().toLocalDate().equals(today))
                .count();
        stats.setTodaySessions(todaySessions);

        return stats;
    }
}
