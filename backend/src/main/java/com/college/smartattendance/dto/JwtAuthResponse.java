package com.college.smartattendance.dto;

public class JwtAuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String role;
    private boolean isFirstLogin;

    public JwtAuthResponse() {
    }

    public JwtAuthResponse(String accessToken, String tokenType, String role, boolean isFirstLogin) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.role = role;
        this.isFirstLogin = isFirstLogin;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isFirstLogin() {
        return isFirstLogin;
    }

    public void setFirstLogin(boolean firstLogin) {
        isFirstLogin = firstLogin;
    }
}
