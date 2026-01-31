package com.college.smartattendance.dto;

import lombok.Data;

@Data
public class StudentAnalyticsDto {
    private long totalSessions;
    private long presentCount;
    private double percentage;
    private String attendanceStatus;

    public StudentAnalyticsDto() {
    }

    // Manual setters if Lombok doesn't kick in immediately in IDE
    public void setTotalSessions(long totalSessions) {
        this.totalSessions = totalSessions;
    }

    public void setPresentCount(long presentCount) {
        this.presentCount = presentCount;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public void setAttendanceStatus(String attendanceStatus) {
        this.attendanceStatus = attendanceStatus;
    }

    public long getTotalSessions() {
        return totalSessions;
    }

    public long getPresentCount() {
        return presentCount;
    }

    public double getPercentage() {
        return percentage;
    }

    public String getAttendanceStatus() {
        return attendanceStatus;
    }
}
