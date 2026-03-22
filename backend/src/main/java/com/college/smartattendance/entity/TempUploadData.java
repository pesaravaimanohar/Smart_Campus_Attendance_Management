package com.college.smartattendance.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "temp_upload_data")
public class TempUploadData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "upload_log_id", nullable = false)
    private Long uploadLogId;

    @Column(name = "row_num", nullable = false)
    private Integer rowNum;

    @Column(name = "data_json", columnDefinition = "TEXT", nullable = false)
    private String dataJson;

    public TempUploadData() {
    }

    public TempUploadData(Long uploadLogId, Integer rowNum, String dataJson) {
        this.uploadLogId = uploadLogId;
        this.rowNum = rowNum;
        this.dataJson = dataJson;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUploadLogId() {
        return uploadLogId;
    }

    public void setUploadLogId(Long uploadLogId) {
        this.uploadLogId = uploadLogId;
    }

    public Integer getRowNum() {
        return rowNum;
    }

    public void setRowNum(Integer rowNum) {
        this.rowNum = rowNum;
    }

    public String getDataJson() {
        return dataJson;
    }

    public void setDataJson(String dataJson) {
        this.dataJson = dataJson;
    }
}
