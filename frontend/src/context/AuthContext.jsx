import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check expiry
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser({ ...decoded, token });
                }
            } catch (e) {
                // Handle Mock Tokens for development
                if (token.startsWith("mock-token-")) {
                    const role = token.replace("mock-token-", "").toUpperCase();
                    setUser({ sub: "mockUser", role: role, token });
                } else {
                    logout();
                }
            }
        }
        setLoading(false);
    }, []);

    const login = (token) => {
        localStorage.setItem("token", token);
        try {
            const decoded = jwtDecode(token);
            setUser({ ...decoded, token });
        } catch (e) {
            // Handle Mock Tokens
            if (token.startsWith("mock-token-")) {
                const role = token.replace("mock-token-", "").toUpperCase();
                setUser({ sub: "mockUser", role: role, token });
            } else {
                console.error("Invalid token", e);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
