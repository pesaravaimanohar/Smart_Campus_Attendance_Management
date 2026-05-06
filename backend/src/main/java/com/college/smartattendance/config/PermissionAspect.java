package com.college.smartattendance.config;

import com.college.smartattendance.entity.Role;
import com.college.smartattendance.entity.User;
import com.college.smartattendance.repository.FacultyRepository;
import com.college.smartattendance.repository.UserRepository;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * AOP Aspect for enforcing permissions at method level.
 * Throws AccessDeniedException (→ HTTP 403) instead of RuntimeException.
 */
@Aspect
@Component
public class PermissionAspect {

    @Autowired
    private PermissionMatrix permissionMatrix;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Around("@annotation(requiresPermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequiresPermission requiresPermission)
            throws Throwable {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User not authenticated");
        }

        String username = authentication.getName();
        String normalizedUsername = username != null ? username.trim().toLowerCase() : "";
        
        User user = userRepository.findByUsername(normalizedUsername)
                .orElseGet(() -> userRepository.findByUsername(username)
                .orElseThrow(() -> new AccessDeniedException("User not found: " + username)));

        Role userRole = user.getRole();
        PermissionMatrix.Permission requiredPermission = requiresPermission.value();

        if (!permissionMatrix.hasPermission(userRole, requiredPermission)) {
            System.err.println("Permission Denied: User " + username + " with role " + userRole + " lacks " + requiredPermission);
            throw new AccessDeniedException(
                    "Access denied: role " + userRole + " lacks permission " + requiredPermission);
        }

        if (requiresPermission.checkDepartment()) {
            String userDepartment = getUserDepartment(user);
            String targetDepartment = extractDepartmentFromArgs(joinPoint);

            if (!permissionMatrix.canAccessDepartment(userRole, userDepartment, targetDepartment)) {
                throw new AccessDeniedException("Access denied: department access restricted");
            }
        }

        return joinPoint.proceed();
    }

    private String getUserDepartment(User user) {
        Role role = user.getRole();
        if (role == Role.ADMIN || role == Role.PRINCIPAL) {
            return null;
        }
        return facultyRepository.findByUser(user)
                .map(f -> {
                    if (f.getDepartmentEntity() != null) {
                        return f.getDepartmentEntity().getCode();
                    }
                    return f.getDepartment();
                })
                .orElse(null);
    }

    private String extractDepartmentFromArgs(ProceedingJoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String[] paramNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < paramNames.length; i++) {
            if (paramNames[i].equals("departmentCode") || paramNames[i].equals("department")) {
                return (String) args[i];
            }
        }
        return null;
    }
}
