package com.college.smartattendance.repository;

import com.college.smartattendance.entity.Student;
import com.college.smartattendance.entity.StudentStatus;
import com.college.smartattendance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUser(User user);
    Optional<Student> findByUser_Username(String username);
    Optional<Student> findByRollNumber(String rollNumber);

    // department field (legacy String column on Student)
    List<Student> findByDepartment(String department);
    List<Student> findByCurrentSemester(Integer semester);
    List<Student> findByStatus(StudentStatus status);
    List<Student> findByDepartmentAndCurrentSemester(String department, Integer semester);
    long countByDepartment(String department);

    // via User relationship
    @Query("SELECT s FROM Student s WHERE s.user.role = 'STUDENT'")
    List<Student> findAllStudents();
}
