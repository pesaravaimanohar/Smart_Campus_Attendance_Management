package com.college.smartattendance.service;

import com.college.smartattendance.entity.AuditLog;
import com.college.smartattendance.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Log an action in the audit trail
     */
    public void logAction(Long userId, String entityType, Long entityId, String action,
            String oldValue, String newValue, String ipAddress) {
        AuditLog log = new AuditLog(userId, entityType, entityId, action);
        log.setOldValue(oldValue);
        log.setNewValue(newValue);
        log.setIpAddress(ipAddress);
        auditLogRepository.save(log);
    }

    /**
     * Log an action without old/new values
     */
    public void logAction(Long userId, String entityType, Long entityId, String action) {
        logAction(userId, entityType, entityId, action, null, null, null);
    }

    /**
     * Get audit trail for a specific entity
     */
    public List<AuditLog> getAuditTrail(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    /**
     * Get recent actions by a user
     */
    public Page<AuditLog> getRecentActions(Long userId, LocalDateTime since, Pageable pageable) {
        return auditLogRepository.findByUserIdAndTimestampAfterOrderByTimestampDesc(userId, since, pageable);
    }

    /**
     * Search audit logs by entity type
     */
    public Page<AuditLog> searchByEntityType(String entityType, Pageable pageable) {
        return auditLogRepository.findByEntityTypeOrderByTimestampDesc(entityType, pageable);
    }
}
