package com.college.smartattendance.dto;

public class StatsDto {
    private long totalStudents;
    private long totalFaculty;
    private long totalClasses;
    private long totalSubjects;
    private long totalSessions;
    private long todaySessions;

    public StatsDto() {
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalFaculty() {
        return totalFaculty;
    }

    public void setTotalFaculty(long totalFaculty) {
        this.totalFaculty = totalFaculty;
    }

    public long getTotalClasses() {
        return totalClasses;
    }

    public void setTotalClasses(long totalClasses) {
        this.totalClasses = totalClasses;
    }

    public long getTotalSubjects() {
        return totalSubjects;
    }

    public void setTotalSubjects(long totalSubjects) {
        this.totalSubjects = totalSubjects;
    }

    public long getTotalSessions() {
        return totalSessions;
    }

    public void setTotalSessions(long totalSessions) {
        this.totalSessions = totalSessions;
    }

    public long getTodaySessions() {
        return todaySessions;
    }

    public void setTodaySessions(long todaySessions) {
        this.todaySessions = todaySessions;
    }
}
