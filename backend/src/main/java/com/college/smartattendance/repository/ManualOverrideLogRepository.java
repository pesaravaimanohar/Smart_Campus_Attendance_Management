package com.college.smartattendance.repository;

import com.college.smartattendance.entity.ManualOverrideLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ManualOverrideLogRepository extends JpaRepository<ManualOverrideLog, Long> {
}
