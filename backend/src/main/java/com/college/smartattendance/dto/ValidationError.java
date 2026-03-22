package com.college.smartattendance.dto;

public class ValidationError {
    private Integer rowNumber;
    private String field;
    private String errorMessage;
    private String recordPreview;

    public ValidationError() {
    }

    public ValidationError(Integer rowNumber, String field, String errorMessage) {
        this.rowNumber = rowNumber;
        this.field = field;
        this.errorMessage = errorMessage;
    }

    // Getters and Setters
    public Integer getRowNumber() {
        return rowNumber;
    }

    public void setRowNumber(Integer rowNumber) {
        this.rowNumber = rowNumber;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public String getRecordPreview() {
        return recordPreview;
    }

    public void setRecordPreview(String recordPreview) {
        this.recordPreview = recordPreview;
    }
}
