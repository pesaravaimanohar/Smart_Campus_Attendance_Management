package com.college.smartattendance.service;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FacultyService {

    @Autowired
    private FacultyRepository facultyRepository;
    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;
    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private ManualOverrideLogRepository manualOverrideLogRepository;

    public Faculty getFacultyByUsername(String username) {
        return facultyRepository.findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
    }

    public ManualOverrideLog markManualAttendance(Long facultyId, Long sessionId, String studentRollNo, String reason) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Student student = studentRepository.findByUser_Username(studentRollNo) // RollNo stored in username
                .orElseThrow(() -> new RuntimeException("Student not found with Roll No: " + studentRollNo));

        // Create Attendance Record
        AttendanceRecord record = attendanceRecordRepository.findBySessionAndStudent(session, student)
                .orElse(new AttendanceRecord());

        record.setSession(session);
        record.setStudent(student);
        record.setTimestamp(LocalDateTime.now());
        record.setStatus(AttendanceStatus.MANUAL_VERIFIED);
        record.setRemarks("Manual override by " + faculty.getUser().getUsername() + ": " + reason);
        attendanceRecordRepository.save(record);

        // Log the Override
        ManualOverrideLog log = new ManualOverrideLog();
        log.setFaculty(faculty);
        log.setStudent(student);
        log.setSession(session);
        log.setTimestamp(LocalDateTime.now());
        log.setReason(reason);
        // Proof image can be optional/added later
        return manualOverrideLogRepository.save(log);
    }
}
