package com.college.smartattendance.dto;

import java.util.Map;

public class ValidRecordPreview {
    private Integer rowNumber;
    private Map<String, String> data;

    public ValidRecordPreview() {
    }

    public ValidRecordPreview(Integer rowNumber, Map<String, String> data) {
        this.rowNumber = rowNumber;
        this.data = data;
    }

    // Getters and Setters
    public Integer getRowNumber() {
        return rowNumber;
    }

    public void setRowNumber(Integer rowNumber) {
        this.rowNumber = rowNumber;
    }

    public Map<String, String> getData() {
        return data;
    }

    public void setData(Map<String, String> data) {
        this.data = data;
    }
}
