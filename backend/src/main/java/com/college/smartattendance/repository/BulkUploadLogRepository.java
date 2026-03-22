package com.college.smartattendance.repository;

import com.college.smartattendance.entity.BulkUploadLog;
import com.college.smartattendance.entity.UploadType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BulkUploadLogRepository extends JpaRepository<BulkUploadLog, Long> {
    List<BulkUploadLog> findTop10ByOrderByUploadedAtDesc();

    List<BulkUploadLog> findByUploadTypeOrderByUploadedAtDesc(UploadType uploadType);

    List<BulkUploadLog> findByUploadedByOrderByUploadedAtDesc(Long uploadedBy);
}
