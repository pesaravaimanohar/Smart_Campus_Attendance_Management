package com.college.smartattendance.repository;

import com.college.smartattendance.entity.Student;
import com.college.smartattendance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUser(User user);

    Optional<Student> findByUser_Username(String username);
}
