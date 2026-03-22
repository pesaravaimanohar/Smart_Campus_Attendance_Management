package com.college.smartattendance.dto;

public class DepartmentDto {
    private Long id;
    private String code;
    private String name;
    private Long hodId;
    private String hodName;
    private Boolean active;

    public DepartmentDto() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getHodId() {
        return hodId;
    }

    public void setHodId(Long hodId) {
        this.hodId = hodId;
    }

    public String getHodName() {
        return hodName;
    }

    public void setHodName(String hodName) {
        this.hodName = hodName;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
