package com.college.smartattendance.repository;

import com.college.smartattendance.entity.AttendanceSession;
import com.college.smartattendance.entity.ManualOverrideLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ManualOverrideLogRepository extends JpaRepository<ManualOverrideLog, Long> {
    List<ManualOverrideLog> findBySession(AttendanceSession session);
    void deleteBySession(AttendanceSession session);
}
