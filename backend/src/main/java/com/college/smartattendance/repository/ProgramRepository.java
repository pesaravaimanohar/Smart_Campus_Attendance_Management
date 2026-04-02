package com.college.smartattendance.repository;

import com.college.smartattendance.entity.Program;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgramRepository extends JpaRepository<Program, Long> {
    List<Program> findByDepartmentId(Long departmentId);

    List<Program> findByActiveTrue();
    default List<Program> findByActive(boolean active) {
        if (active) return findByActiveTrue();
        return findAll().stream().filter(p -> !Boolean.TRUE.equals(p.getActive()))
                .collect(java.util.stream.Collectors.toList());
    }
}
