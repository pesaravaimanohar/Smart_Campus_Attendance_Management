package com.college.smartattendance.dto;

import java.util.ArrayList;
import java.util.List;

public class BulkUploadValidationResult {
    private Long uploadLogId;
    private String fileName;
    private Integer totalRecords;
    private Integer validRecords;
    private Integer invalidRecords;
    private List<ValidRecordPreview> validData = new ArrayList<>();
    private List<ValidationError> errors = new ArrayList<>();

    public BulkUploadValidationResult() {
    }

    // Getters and Setters
    public Long getUploadLogId() {
        return uploadLogId;
    }

    public void setUploadLogId(Long uploadLogId) {
        this.uploadLogId = uploadLogId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Integer getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(Integer totalRecords) {
        this.totalRecords = totalRecords;
    }

    public Integer getValidRecords() {
        return validRecords;
    }

    public void setValidRecords(Integer validRecords) {
        this.validRecords = validRecords;
    }

    public Integer getInvalidRecords() {
        return invalidRecords;
    }

    public void setInvalidRecords(Integer invalidRecords) {
        this.invalidRecords = invalidRecords;
    }

    public List<ValidRecordPreview> getValidData() {
        return validData;
    }

    public void setValidData(List<ValidRecordPreview> validData) {
        this.validData = validData;
    }

    public List<ValidationError> getErrors() {
        return errors;
    }

    public void setErrors(List<ValidationError> errors) {
        this.errors = errors;
    }
}
