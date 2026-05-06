package com.college.smartattendance.repository;

import com.college.smartattendance.entity.EmploymentStatus;
import com.college.smartattendance.entity.Faculty;
import com.college.smartattendance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByUser(User user);
    Optional<Faculty> findByUser_Username(String username);
    Optional<Faculty> findByFacultyId(String facultyId);

    // department (legacy String field)
    List<Faculty> findByDepartment(String department);
    List<Faculty> findByEmploymentStatus(EmploymentStatus status);
    long countByDepartment(String department);

    // via user_id FK
    Optional<Faculty> findByUser_Id(Long userId);

    long countByDepartmentEntity_Id(Long departmentId);
    List<Faculty> findByDepartmentEntity_Id(Long departmentId);
}
