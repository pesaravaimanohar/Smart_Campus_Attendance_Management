package com.college.smartattendance.repository;

import com.college.smartattendance.entity.AttendanceRecord;
import com.college.smartattendance.entity.AttendanceSession;
import com.college.smartattendance.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    Optional<AttendanceRecord> findBySessionAndStudent(AttendanceSession session, Student student);

    List<AttendanceRecord> findBySession(AttendanceSession session);

    List<AttendanceRecord> findByStudent(Student student);

    // Analytics
    long countByStudentAndStatus(Student student, com.college.smartattendance.entity.AttendanceStatus status);
    void deleteByStudent_Id(Long studentId);
}
