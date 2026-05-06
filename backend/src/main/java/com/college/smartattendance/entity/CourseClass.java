package com.college.smartattendance.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "classes")
public class CourseClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String department;

    private int yearLevel;

    @Enumerated(EnumType.STRING)
    private ProgramType programType;

    @Column(columnDefinition = "TEXT")
    private String timetable;

    @Column(columnDefinition = "TEXT")
    private String syllabus;

    private String timetableUrl;

    private String syllabusUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crc_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Faculty crc;

    public CourseClass() {
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

    public ProgramType getProgramType() {
        return programType;
    }

    public void setProgramType(ProgramType programType) {
        this.programType = programType;
    }

    public String getTimetable() {
        return timetable;
    }

    public void setTimetable(String timetable) {
        this.timetable = timetable;
    }

    public String getSyllabus() {
        return syllabus;
    }

    public void setSyllabus(String syllabus) {
        this.syllabus = syllabus;
    }

    public Faculty getCrc() {
        return crc;
    }

    public void setCrc(Faculty crc) {
        this.crc = crc;
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
}
