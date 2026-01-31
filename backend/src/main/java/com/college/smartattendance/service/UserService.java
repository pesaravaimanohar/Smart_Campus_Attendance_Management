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

    public void changePassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username).orElseThrow();
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
