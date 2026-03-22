package com.college.smartattendance.service;

import com.college.smartattendance.entity.Role;
import com.college.smartattendance.entity.User;
import com.college.smartattendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Incorrect current password");
        }

        // Check for reuse
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("New password cannot be the same as the current password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setFirstLogin(false);
        userRepository.save(user);
    }

    // Helper to generate default password logic
    public String generateDefaultPassword(User user) {
        // DOB DDMMYYYY
        if (user.getDob() == null)
            return "password"; // Fallback
        return user.getDob().format(DateTimeFormatter.ofPattern("ddMMyyyy"));
    }
}
