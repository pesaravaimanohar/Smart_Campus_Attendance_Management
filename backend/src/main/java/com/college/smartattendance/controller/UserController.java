package com.college.smartattendance.controller;

import com.college.smartattendance.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request, Principal principal) {
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");

        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password is required"));
        }
        if (oldPassword == null || oldPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password is required"));
        }

        try {
            userService.changePassword(principal.getName(), oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully. Please login again."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to change password: " + e.getMessage()));
        }
    }
}
