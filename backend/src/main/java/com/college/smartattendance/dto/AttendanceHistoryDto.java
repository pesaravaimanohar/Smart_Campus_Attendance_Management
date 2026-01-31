package com.college.smartattendance.dto;

import java.time.LocalDateTime;

public class AttendanceHistoryDto {
    private LocalDateTime date;
    private String subjectName;
    private String status; // "Present", "Absent", "Pending"
    private String remarks;

    public AttendanceHistoryDto() {
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
