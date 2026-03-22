package com.college.smartattendance.config;

import java.lang.annotation.*;

/**
 * Custom annotation for method-level permission checking
 * Usage: @RequiresPermission(PermissionMatrix.Permission.STUDENT_CREATE)
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequiresPermission {
    PermissionMatrix.Permission value();

    /**
     * If true, requires department-scoped access control
     * The department will be extracted from method parameters
     */
    boolean checkDepartment() default false;
}
