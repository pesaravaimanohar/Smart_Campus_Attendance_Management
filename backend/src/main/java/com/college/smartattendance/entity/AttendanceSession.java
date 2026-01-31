package com.college.smartattendance.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_session")
public class AttendanceSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "faculty_subject_map_id", nullable = false)
    private FacultySubjectMap facultySubjectMap;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private boolean isActive;

    private Double latitude;
    private Double longitude;
    private Double radius;

    public AttendanceSession() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public FacultySubjectMap getFacultySubjectMap() {
        return facultySubjectMap;
    }

    public void setFacultySubjectMap(FacultySubjectMap facultySubjectMap) {
        this.facultySubjectMap = facultySubjectMap;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getRadius() {
        return radius;
    }

    public void setRadius(Double radius) {
        this.radius = radius;
    }
}
