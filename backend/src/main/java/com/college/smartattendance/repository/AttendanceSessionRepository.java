package com.college.smartattendance.repository;

import com.college.smartattendance.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByIsActiveTrue();
    Optional<AttendanceSession> findByQrToken(String qrToken);
    List<AttendanceSession> findByFacultySubjectMap_Id(Long facultySubjectMapId);
    List<AttendanceSession> findByFacultySubjectMap_Faculty_Department(String department);
    long countByIsActiveTrue();
    long countByIsActiveTrueAndFacultySubjectMap_Faculty_Department(String department);
    List<AttendanceSession> findByCreatedByFacultyId(Long createdByFacultyId);
    List<AttendanceSession> findByCourseClass_Id(Long classId);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM AttendanceSession s WHERE s.courseClass.id = :classId " +
           "AND CAST(s.startTime AS date) = CURRENT_DATE")
    List<AttendanceSession> findSessionsByClassForToday(@org.springframework.data.repository.query.Param("classId") Long classId);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM AttendanceSession s WHERE s.isActive = true AND " +
           "(s.facultySubjectMap.faculty.id = :facultyId OR s.createdByFacultyId = :facultyId) " +
           "ORDER BY s.startTime DESC")
    List<AttendanceSession> findActiveSessionsByFaculty(@org.springframework.data.repository.query.Param("facultyId") Long facultyId);
}

