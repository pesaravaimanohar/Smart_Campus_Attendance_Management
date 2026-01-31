package com.college.smartattendance.repository;

import com.college.smartattendance.entity.Faculty;
import com.college.smartattendance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByUser(User user);

    Optional<Faculty> findByUser_Username(String username);
}
