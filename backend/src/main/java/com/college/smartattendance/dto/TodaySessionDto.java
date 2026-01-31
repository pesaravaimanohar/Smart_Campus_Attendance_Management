package com.college.smartattendance.dto;

import java.time.LocalDateTime;

public class TodaySessionDto {
    private Long sessionId;
    private String subjectName;
    private String facultyName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status; // "Open", "Upcoming", "Closed"
    private Boolean hasMarkedAttendance;

    public TodaySessionDto() {
    }

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getFacultyName() {
        return facultyName;
    }

    public void setFacultyName(String facultyName) {
        this.facultyName = facultyName;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getHasMarkedAttendance() {
        return hasMarkedAttendance;
    }

    public void setHasMarkedAttendance(Boolean hasMarkedAttendance) {
        this.hasMarkedAttendance = hasMarkedAttendance;
    }
}
