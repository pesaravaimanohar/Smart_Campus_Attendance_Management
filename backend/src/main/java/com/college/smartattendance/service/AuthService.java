package com.college.smartattendance.service;

import com.college.smartattendance.config.JwtTokenProvider;
import com.college.smartattendance.dto.JwtAuthResponse;
import com.college.smartattendance.dto.LoginDto;
import com.college.smartattendance.entity.User;
import com.college.smartattendance.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public JwtAuthResponse login(LoginDto loginDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDto.getUsername(), loginDto.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtTokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(loginDto.getUsername()).orElseThrow();

        return new JwtAuthResponse(token, "Bearer", user.getRole().name(), user.isFirstLogin());
    }
}
