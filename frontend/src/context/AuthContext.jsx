import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

const parseStoredToken = (token) => {
    try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
            return null;
        }
        return { ...decoded, token };
    } catch {
        if (token.startsWith("mock-token-")) {
            const role = token.replace("mock-token-", "").toUpperCase();
            return { sub: "mockUser", role, token };
        }
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            const parsedUser = parseStoredToken(token);
            if (parsedUser) {
                setUser(parsedUser);
            } else {
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = (token) => {
        localStorage.setItem("token", token);
        const parsedUser = parseStoredToken(token);
        if (parsedUser) {
            setUser(parsedUser);
        } else {
            console.error("Invalid token");
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
