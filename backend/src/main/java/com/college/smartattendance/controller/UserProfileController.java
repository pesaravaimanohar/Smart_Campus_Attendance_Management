package com.college.smartattendance.controller;

import com.college.smartattendance.entity.User;
import com.college.smartattendance.repository.FacultyRepository;
import com.college.smartattendance.repository.UserRepository;
import com.college.smartattendance.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/me")
public class UserProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole().toString());
            response.put("profileImage", user.getProfileImage());
            response.put("contactNumber", user.getContactNumber());
            response.put("gender", user.getGender());
            response.put("dob", user.getDob());

            facultyRepository.findByUser(user).ifPresent(faculty -> {
                response.put("facultyId", faculty.getFacultyId());
                response.put("designation", faculty.getDesignation());
                if (faculty.getDepartmentEntity() != null) {
                    response.put("departmentCode", faculty.getDepartmentEntity().getCode());
                    response.put("departmentName", faculty.getDepartmentEntity().getName());
                } else if (faculty.getDepartment() != null) {
                    response.put("departmentCode", faculty.getDepartment());
                }
            });

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to fetch user profile: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/profile-image")
    public ResponseEntity<?> updateProfileImage(@RequestParam("file") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Delete old profile image if exists
            if (user.getProfileImage() != null && !user.getProfileImage().isEmpty()) {
                fileStorageService.deleteFile(user.getProfileImage());
            }

            // Store new file
            String fileUrl = fileStorageService.storeFile(file, user.getId().toString());
            user.setProfileImage(fileUrl);
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile picture updated successfully");
            response.put("profileImage", fileUrl);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to upload profile picture: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/profile-image")
    public ResponseEntity<?> removeProfileImage() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Delete profile image file
            if (user.getProfileImage() != null && !user.getProfileImage().isEmpty()) {
                fileStorageService.deleteFile(user.getProfileImage());
            }

            user.setProfileImage(null);
            userRepository.save(user);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Profile picture removed successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to remove profile picture: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> updates) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();

            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Update allowed fields
            if (updates.containsKey("firstName")) {
                user.setFirstName(updates.get("firstName"));
            }
            if (updates.containsKey("lastName")) {
                user.setLastName(updates.get("lastName"));
            }
            if (updates.containsKey("email")) {
                user.setEmail(updates.get("email"));
            }
            if (updates.containsKey("contactNumber")) {
                user.setContactNumber(updates.get("contactNumber"));
            }

            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile updated successfully");
            response.put("user", user);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to update profile: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
