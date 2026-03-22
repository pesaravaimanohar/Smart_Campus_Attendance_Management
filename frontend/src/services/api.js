import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const loginUser = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
};

export const getStudentHistory = async () => {
    // Placeholder
    return [];
};

export const markAttendance = async (formData) => {
    const response = await api.post("/student/mark-attendance", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

export const createSession = async (data) => {
    const response = await api.post("/faculty/sessions", data);
    return response.data;
};

export const getFacultyMappings = async () => {
    const response = await api.get("/faculty/mappings");
    return response.data;
};

export const getStudentAnalytics = async () => {
    const response = await api.get("/student/analytics");
    return response.data;
};

export const markManualAttendance = async (data) => {
    const response = await api.post("/faculty/manual-attendance", data);
    return response.data;
};

export const getStudentSubjects = async () => {
    const response = await api.get("/student/subjects");
    return response.data;
};

export const getSubjectAttendance = async (subjectId) => {
    const response = await api.get(`/student/subject-attendance/${subjectId}`);
    return response.data;
};

export const getAttendanceStatus = async () => {
    try {
        const response = await api.get("/student/attendance-status");
        return response.data;
    } catch (error) {
        // Mock data fallback
        return {
            status: "Shortage",
            currentPercentage: 68.5,
            requiredPercentage: 75.0,
            classesNeededForEligibility: 6,
            totalPresent: 45,
            totalSessions: 65
        };
    }
};

export const getTodaySessions = async () => {
    try {
        const response = await api.get("/student/today-sessions");
        return response.data;
    } catch (error) {
        // Mock data fallback
        return [
            {
                sessionId: 1,
                subjectName: "Data Structures",
                facultyName: "Dr. Smith",
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString(),
                status: "Open",
                hasMarkedAttendance: false
            },
            {
                sessionId: 2,
                subjectName: "Operating Systems",
                facultyName: "Prof. Johnson",
                startTime: new Date(Date.now() + 7200000).toISOString(),
                endTime: new Date(Date.now() + 10800000).toISOString(),
                status: "Upcoming",
                hasMarkedAttendance: false
            }
        ];
    }
};

export const getAttendanceHistory = async (limit = 5) => {
    try {
        const response = await api.get(`/student/attendance-history?limit=${limit}`);
        return response.data;
    } catch (error) {
        // Mock data fallback
        return [
            {
                date: new Date(Date.now() - 86400000).toISOString(),
                subjectName: "Database Management",
                status: "Present",
                remarks: null
            },
            {
                date: new Date(Date.now() - 172800000).toISOString(),
                subjectName: "Computer Networks",
                status: "Present",
                remarks: null
            },
            {
                date: new Date(Date.now() - 259200000).toISOString(),
                subjectName: "Data Structures",
                status: "Absent",
                remarks: null
            },
            {
                date: new Date(Date.now() - 345600000).toISOString(),
                subjectName: "Operating Systems",
                status: "Present",
                remarks: "Manual Override"
            },
            {
                date: new Date(Date.now() - 432000000).toISOString(),
                subjectName: "Web Technologies",
                status: "Present",
                remarks: null
            }
        ];
    }
};

export const getStudentAlerts = async () => {
    try {
        const response = await api.get("/student/alerts");
        return response.data;
    } catch (error) {
        // Mock data fallback
        return [
            "⚠️ Your overall attendance is below 75% (68.5%)",
            "🔴 Low attendance in Operating Systems (62.3%)",
            "⚠️ You missed attendance for Database Management yesterday"
        ];
    }
};

// Admin APIs
export const uploadStudents = async (formData) => {
    const response = await api.post("/admin/upload/students", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

export const uploadFaculty = async (formData) => {
    const response = await api.post("/admin/upload/faculty", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

export const createClass = async (classData) => {
    const response = await api.post("/admin/classes", classData);
    return response.data;
};

export const getClasses = async () => {
    const response = await api.get("/admin/classes");
    return response.data;
};

export const deleteClass = async (id) => {
    const response = await api.delete(`/admin/classes/${id}`);
    return response.data;
};

export const getAdminStats = async () => {
    const response = await api.get("/admin/stats");
    return response.data;
};

export const resetAllUsers = async () => {
    const response = await api.post("/admin/users/reset-first-login");
    return response.data;
};

export const changePassword = async (oldPassword, newPassword) => {
    const response = await api.post("/users/change-password", { oldPassword, newPassword });
    return response.data;
};

export default api;
