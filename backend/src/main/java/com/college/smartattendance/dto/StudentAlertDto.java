package com.college.smartattendance.dto;

import java.time.LocalDateTime;

public class StudentAlertDto {
    private Long id;
    private String alertKey;
    private String message;
    private String type;
    private LocalDateTime createdAt;

    public StudentAlertDto() {}

    public StudentAlertDto(Long id, String alertKey, String message, String type, LocalDateTime createdAt) {
        this.id = id;
        this.alertKey = alertKey;
        this.message = message;
        this.type = type;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAlertKey() { return alertKey; }
    public void setAlertKey(String alertKey) { this.alertKey = alertKey; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
