package com.college.smartattendance.config;

import com.college.smartattendance.entity.Role;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Permission matrix defining what each role can do
 * This is a centralized permission management system
 */
@Component
public class PermissionMatrix {

    // Permission categories
    public enum Permission {
        // Student Management
        STUDENT_CREATE,
        STUDENT_READ,
        STUDENT_UPDATE,
        STUDENT_DELETE,
        STUDENT_BULK_UPLOAD,

        // Faculty Management
        FACULTY_CREATE,
        FACULTY_READ,
        FACULTY_UPDATE,
        FACULTY_DELETE,
        FACULTY_BULK_UPLOAD,

        // Department Management
        DEPARTMENT_CREATE,
        DEPARTMENT_READ,
        DEPARTMENT_UPDATE,
        DEPARTMENT_DELETE,
        DEPARTMENT_SET_HOD,

        // Subject Management
        SUBJECT_CREATE,
        SUBJECT_READ,
        SUBJECT_UPDATE,
        SUBJECT_DELETE,

        // Eligibility & Assignment
        ELIGIBILITY_MANAGE,
        ASSIGNMENT_CREATE,
        ASSIGNMENT_READ,
        ASSIGNMENT_UPDATE,
        ASSIGNMENT_DELETE,
        ASSIGNMENT_LOCK,
        ASSIGNMENT_UNLOCK,

        // Promotion
        PROMOTION_EXECUTE,
        PROMOTION_REVERSE,
        PROMOTION_VIEW,

        // Attendance
        ATTENDANCE_MARK,
        ATTENDANCE_VIEW_OWN,
        ATTENDANCE_VIEW_ALL,
        ATTENDANCE_UPDATE,
        ATTENDANCE_DELETE,

        // Audit
        AUDIT_READ,

        // System
        SYSTEM_ADMIN
    }

    private static final Map<Role, Set<Permission>> ROLE_PERMISSIONS = new HashMap<>();

    static {
        // ADMIN - Full system access
        ROLE_PERMISSIONS.put(Role.ADMIN, EnumSet.allOf(Permission.class));

        // PRINCIPAL - Almost full access, except system admin
        Set<Permission> principalPerms = EnumSet.allOf(Permission.class);
        principalPerms.remove(Permission.SYSTEM_ADMIN);
        ROLE_PERMISSIONS.put(Role.PRINCIPAL, principalPerms);

        // HOD - Department-scoped management
        ROLE_PERMISSIONS.put(Role.HOD, EnumSet.of(
                // Student
                Permission.STUDENT_READ,
                Permission.STUDENT_UPDATE,
                Permission.STUDENT_BULK_UPLOAD,

                // Faculty (read only)
                Permission.FACULTY_READ,

                // Department (read only)
                Permission.DEPARTMENT_READ,

                // Subject
                Permission.SUBJECT_READ,
                Permission.SUBJECT_CREATE,
                Permission.SUBJECT_UPDATE,

                // Eligibility & Assignment
                Permission.ELIGIBILITY_MANAGE,
                Permission.ASSIGNMENT_CREATE,
                Permission.ASSIGNMENT_READ,
                Permission.ASSIGNMENT_UPDATE,
                Permission.ASSIGNMENT_DELETE,
                Permission.ASSIGNMENT_LOCK,

                // Promotion
                Permission.PROMOTION_EXECUTE,
                Permission.PROMOTION_VIEW,

                // Attendance
                Permission.ATTENDANCE_VIEW_ALL,

                // Audit
                Permission.AUDIT_READ));

        // FACULTY - Teaching and attendance only
        ROLE_PERMISSIONS.put(Role.FACULTY, EnumSet.of(
                // Student (read only their own classes)
                Permission.STUDENT_READ,

                // Assignment (read only)
                Permission.ASSIGNMENT_READ,

                // Attendance
                Permission.ATTENDANCE_MARK,
                Permission.ATTENDANCE_VIEW_OWN,
                Permission.ATTENDANCE_UPDATE,

                // Subject (read only)
                Permission.SUBJECT_READ));

        // STUDENT - Read-only access to own data
        ROLE_PERMISSIONS.put(Role.STUDENT, EnumSet.of(
                Permission.ATTENDANCE_VIEW_OWN,
                Permission.PROMOTION_VIEW));
    }

    /**
     * Check if a role has a specific permission
     */
    public boolean hasPermission(Role role, Permission permission) {
        Set<Permission> permissions = ROLE_PERMISSIONS.get(role);
        return permissions != null && permissions.contains(permission);
    }

    /**
     * Get all permissions for a role
     */
    public Set<Permission> getPermissions(Role role) {
        return ROLE_PERMISSIONS.getOrDefault(role, EnumSet.noneOf(Permission.class));
    }

    /**
     * Check if user can access department data
     * HOD can only access their own department
     * ADMIN/PRINCIPAL can access all departments
     */
    public boolean canAccessDepartment(Role role, String userDepartment, String targetDepartment) {
        if (role == Role.ADMIN || role == Role.PRINCIPAL) {
            return true;
        }

        if (role == Role.HOD) {
            return userDepartment != null && userDepartment.equals(targetDepartment);
        }

        return false;
    }

    /**
     * Check if faculty can mark attendance for a subject
     * Faculty can only mark attendance for their assigned subjects
     */
    public boolean canMarkAttendanceForSubject(Long facultyId, Long subjectId, Long assignmentId) {
        // This will be verified in the service layer using FacultySubjectMapRepository
        // Just a placeholder here
        return true;
    }
}
