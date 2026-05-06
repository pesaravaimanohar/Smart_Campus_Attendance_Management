package com.college.smartattendance.dto;

import com.college.smartattendance.entity.SubjectType;

public class SubjectDto {
    private Long id;
    private String name;
    private String code;
    private String subjectType = "REGULAR";

    public SubjectDto() {
    }

    public SubjectDto(Long id, String name, String code) {
        this.id = id;
        this.name = name;
        this.code = code;
    }

    public SubjectDto(Long id, String name, String code, String subjectType) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.subjectType = subjectType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getSubjectType() { return subjectType; }
    public void setSubjectType(String subjectType) { this.subjectType = subjectType; }
}
