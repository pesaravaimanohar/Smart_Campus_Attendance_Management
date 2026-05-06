package com.college.smartattendance.dto;

import com.college.smartattendance.entity.ProgramType;

import java.time.LocalDateTime;

public class ClassCurriculumDto {
    private Long id;
    private String departmentCode;
    private ProgramType program;
    private Integer semester;
    /** Empty = all sections */
    private String sectionKey;
    private String timetableText;
    private String syllabusText;
    private String syllabusUrl;
    private String timetableImageUrl;

    private LocalDateTime updatedAt;

    public ClassCurriculumDto() {}

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

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public String getSectionKey() {
        return sectionKey;
    }

    public void setSectionKey(String sectionKey) {
        this.sectionKey = sectionKey;
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
