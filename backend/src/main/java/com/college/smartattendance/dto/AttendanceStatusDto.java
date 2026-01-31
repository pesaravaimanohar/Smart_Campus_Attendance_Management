package com.college.smartattendance.dto;

public class AttendanceStatusDto {
    private String status; // "Eligible" or "Shortage"
    private Double currentPercentage;
    private Double requiredPercentage;
    private Integer classesNeededForEligibility;
    private Integer totalPresent;
    private Integer totalSessions;

    public AttendanceStatusDto() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getCurrentPercentage() {
        return currentPercentage;
    }

    public void setCurrentPercentage(Double currentPercentage) {
        this.currentPercentage = currentPercentage;
    }

    public Double getRequiredPercentage() {
        return requiredPercentage;
    }

    public void setRequiredPercentage(Double requiredPercentage) {
        this.requiredPercentage = requiredPercentage;
    }

    public Integer getClassesNeededForEligibility() {
        return classesNeededForEligibility;
    }

    public void setClassesNeededForEligibility(Integer classesNeededForEligibility) {
        this.classesNeededForEligibility = classesNeededForEligibility;
    }

    public Integer getTotalPresent() {
        return totalPresent;
    }

    public void setTotalPresent(Integer totalPresent) {
        this.totalPresent = totalPresent;
    }

    public Integer getTotalSessions() {
        return totalSessions;
    }

    public void setTotalSessions(Integer totalSessions) {
        this.totalSessions = totalSessions;
    }
}
