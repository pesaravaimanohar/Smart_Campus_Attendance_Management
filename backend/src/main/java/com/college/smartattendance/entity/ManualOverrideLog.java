package com.college.smartattendance.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "manual_override_log")
public class ManualOverrideLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    private LocalDateTime timestamp;
    private String reason;
    private String proofImagePath;

    public ManualOverrideLog() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Faculty getFaculty() {
        return faculty;
    }

    public void setFaculty(Faculty faculty) {
        this.faculty = faculty;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public AttendanceSession getSession() {
        return session;
    }

    public void setSession(AttendanceSession session) {
        this.session = session;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getProofImagePath() {
        return proofImagePath;
    }

    public void setProofImagePath(String proofImagePath) {
        this.proofImagePath = proofImagePath;
    }
}
