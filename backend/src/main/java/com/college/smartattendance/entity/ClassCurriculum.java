package com.college.smartattendance.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "class_curriculum", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"department_code", "program", "semester", "section_key"})
})
public class ClassCurriculum {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "department_code", nullable = false, length = 32)
    private String departmentCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private ProgramType program = ProgramType.UG;

    @Column(nullable = false)
    private int semester;

    /**
     * Empty string = applies to all sections in this dept/program/semester.
     * Otherwise must match student.section (case-insensitive at service layer).
     */
    @Column(name = "section_key", nullable = false, length = 16)
    private String sectionKey = "";

    @Column(name = "timetable_text", columnDefinition = "TEXT")
    private String timetableText;

    @Column(name = "syllabus_text", columnDefinition = "TEXT")
    private String syllabusText;

    @Column(name = "syllabus_url", length = 1024)
    private String syllabusUrl;

    @Column(name = "timetable_image_url", length = 1024)
    private String timetableImageUrl;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDepartmentCode() {
        return departmentCode;
    }

    public void setDepartmentCode(String departmentCode) {
        this.departmentCode = departmentCode;
    }

    public ProgramType getProgram() {
        return program;
    }

    public void setProgram(ProgramType program) {
        this.program = program;
    }

    public int getSemester() {
        return semester;
    }

    public void setSemester(int semester) {
        this.semester = semester;
    }

    public String getSectionKey() {
        return sectionKey;
    }

    public void setSectionKey(String sectionKey) {
        this.sectionKey = sectionKey != null ? sectionKey : "";
    }

    public String getTimetableText() {
        return timetableText;
    }

    public void setTimetableText(String timetableText) {
        this.timetableText = timetableText;
    }

    public String getSyllabusText() {
        return syllabusText;
    }

    public void setSyllabusText(String syllabusText) {
        this.syllabusText = syllabusText;
    }

    public String getSyllabusUrl() {
        return syllabusUrl;
    }

    public void setSyllabusUrl(String syllabusUrl) {
        this.syllabusUrl = syllabusUrl;
    }

    public String getTimetableImageUrl() {
        return timetableImageUrl;
    }

    public void setTimetableImageUrl(String timetableImageUrl) {
        this.timetableImageUrl = timetableImageUrl;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
