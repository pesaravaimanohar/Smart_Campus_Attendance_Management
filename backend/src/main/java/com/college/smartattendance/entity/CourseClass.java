package com.college.smartattendance.entity;

import jakarta.persistence.*;

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
}
