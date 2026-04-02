package com.college.smartattendance.repository;

import com.college.smartattendance.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByIsActiveTrue();
    Optional<AttendanceSession> findByQrToken(String qrToken);
    List<AttendanceSession> findByFacultySubjectMap_Id(Long facultySubjectMapId);
}

