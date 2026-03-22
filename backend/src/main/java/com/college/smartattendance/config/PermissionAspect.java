package com.college.smartattendance.config;

import com.college.smartattendance.entity.Role;
import com.college.smartattendance.entity.User;
import com.college.smartattendance.repository.UserRepository;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * AOP Aspect for enforcing permissions at method level
 */
@Aspect
@Component
public class PermissionAspect {

    @Autowired
    private PermissionMatrix permissionMatrix;

    @Autowired
    private UserRepository userRepository;

    @Around("@annotation(requiresPermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequiresPermission requiresPermission)
            throws Throwable {

        // Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role userRole = user.getRole();
        PermissionMatrix.Permission requiredPermission = requiresPermission.value();

        // Check if user has the required permission
        if (!permissionMatrix.hasPermission(userRole, requiredPermission)) {
            throw new RuntimeException("Access denied: insufficient permissions");
        }

        // If department check is required
        if (requiresPermission.checkDepartment()) {
            String userDepartment = getUserDepartment(user);
            String targetDepartment = extractDepartmentFromArgs(joinPoint);

            if (!permissionMatrix.canAccessDepartment(userRole, userDepartment, targetDepartment)) {
                throw new RuntimeException("Access denied: department access restricted");
            }
        }

        // Proceed with method execution
        return joinPoint.proceed();
    }

    private String getUserDepartment(User user) {
        // Implement logic to get user's department
        // This would require looking up Student or Faculty entity
        return null; // Placeholder
    }

    private String extractDepartmentFromArgs(ProceedingJoinPoint joinPoint) {
        // Extract department from method parameters
        // Look for parameters named "departmentCode" or similar
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
