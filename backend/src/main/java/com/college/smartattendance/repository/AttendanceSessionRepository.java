package com.college.smartattendance.repository;

import com.college.smartattendance.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByIsActiveTrue();
}
