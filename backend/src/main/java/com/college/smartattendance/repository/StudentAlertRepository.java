package com.college.smartattendance.repository;

import com.college.smartattendance.entity.StudentAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudentAlertRepository extends JpaRepository<StudentAlert, Long> {
    List<StudentAlert> findByStudent_IdAndIsReadFalse(Long studentId);
    Optional<StudentAlert> findByStudent_IdAndAlertKey(Long studentId, String alertKey);
}
