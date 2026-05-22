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
    @JoinColumn(name = "faculty_subject_map_id", nullable = true)
    private FacultySubjectMap facultySubjectMap;

    @ManyToOne
    @JoinColumn(name = "course_class_id", nullable = true)
    private CourseClass courseClass;

    @ManyToOne
    @JoinColumn(name = "lab_subject_id", nullable = true)
    private Subject labSubject;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = false;

    @Column(name = "is_lab_session", nullable = false)
    private Boolean isLabSession = false;

    @Column(nullable = true)
    private Long createdByFacultyId;

    private Double latitude;
    private Double longitude;
    private Double radius;

    @Column(unique = true)
    private String qrToken;

    private String remarks;

    private String period;

    @Column(name = "number_of_hours", nullable = false)
    private Integer numberOfHours = 1;

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

    public CourseClass getCourseClass() {
        return courseClass;
    }

    public void setCourseClass(CourseClass courseClass) {
        this.courseClass = courseClass;
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

    public String getQrToken() {
        return qrToken;
    }

    public void setQrToken(String qrToken) {
        this.qrToken = qrToken;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public Subject getLabSubject() {
        return labSubject;
    }

    public void setLabSubject(Subject labSubject) {
        this.labSubject = labSubject;
    }

    public Boolean getIsLabSession() {
        return isLabSession;
    }

    public void setIsLabSession(Boolean isLabSession) {
        this.isLabSession = isLabSession;
    }

    public Long getCreatedByFacultyId() {
        return createdByFacultyId;
    }

    public void setCreatedByFacultyId(Long createdByFacultyId) {
        this.createdByFacultyId = createdByFacultyId;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public Integer getNumberOfHours() {
        return numberOfHours;
    }

    public void setNumberOfHours(Integer numberOfHours) {
        this.numberOfHours = numberOfHours;
    }
}
