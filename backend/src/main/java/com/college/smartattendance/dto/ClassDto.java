package com.college.smartattendance.dto;

public class ClassDto {
    private Long id;
    private String name;
    private String department;
    private int yearLevel;
    private String programType;
    private String timetableUrl;
    private String syllabusUrl;
    private String timetable;
    private Long crcId;
    private String crcName;

    public ClassDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public int getYearLevel() {
        return yearLevel;
    }

    public void setYearLevel(int yearLevel) {
        this.yearLevel = yearLevel;
    }

    public String getProgramType() {
        return programType;
    }

    public void setProgramType(String programType) {
        this.programType = programType;
    }

    public String getTimetableUrl() {
        return timetableUrl;
    }

    public void setTimetableUrl(String timetableUrl) {
        this.timetableUrl = timetableUrl;
    }

    public String getSyllabusUrl() {
        return syllabusUrl;
    }

    public void setSyllabusUrl(String syllabusUrl) {
        this.syllabusUrl = syllabusUrl;
    }

    public String getTimetable() {
        return timetable;
    }

    public void setTimetable(String timetable) {
        this.timetable = timetable;
    }

    public Long getCrcId() {
        return crcId;
    }

    public void setCrcId(Long crcId) {
        this.crcId = crcId;
    }

    public String getCrcName() {
        return crcName;
    }

    public void setCrcName(String crcName) {
        this.crcName = crcName;
    }
}
