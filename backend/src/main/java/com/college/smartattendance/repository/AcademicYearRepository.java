package com.college.smartattendance.repository;

import com.college.smartattendance.entity.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {
    Optional<AcademicYear> findByName(String name);

    Optional<AcademicYear> findByActiveTrue();
}
