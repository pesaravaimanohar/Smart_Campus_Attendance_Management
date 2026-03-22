package com.college.smartattendance.repository;

import com.college.smartattendance.entity.TempUploadData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TempUploadDataRepository extends JpaRepository<TempUploadData, Long> {
    List<TempUploadData> findByUploadLogIdOrderByRowNum(Long uploadLogId);

    void deleteByUploadLogId(Long uploadLogId);
}
