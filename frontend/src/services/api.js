import axios from 'axios';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ==================== AUTHENTICATION API ====================

export const loginUser = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    return response.data;
};

export const changePassword = async (oldPassword, newPassword) => {
    const response = await apiClient.post('/users/change-password', { oldPassword, newPassword });
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await apiClient.get('/me');
    return response.data;
};

// ==================== STUDENT ATTENDANCE API ====================
// All student endpoints are under /student/* to match the backend StudentController

export const markAttendance = async (formData) => {
    const response = await apiClient.post('/student/mark-attendance', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getStudentAnalytics = async () => {
    const response = await apiClient.get('/student/analytics');
    return response.data;
};

export const getAttendanceStatus = async () => {
    const response = await apiClient.get('/student/attendance-status');
    return response.data;
};

export const getTodaySessions = async () => {
    const response = await apiClient.get('/student/today-sessions');
    return response.data;
};

export const getAttendanceHistory = async (limit = 10) => {
    const response = await apiClient.get('/student/attendance-history', {
        params: { limit },
    });
    return response.data;
};

export const getStudentAlerts = async () => {
    const response = await apiClient.get('/student/alerts');
    return response.data;
};

export const markAlertAsRead = async (alertId) => {
    const response = await apiClient.post(`/student/alerts/${alertId}/read`);
    return response.data;
};

export const getStudentSubjects = async () => {
    const response = await apiClient.get('/student/subjects');
    return response.data;
};

/** Timetable & syllabus for the logged-in student's class (dept + program + semester + section). */
export const getStudentClassCurriculum = async () => {
    const response = await apiClient.get('/student/class-curriculum');
    return response.data;
};

export const getSubjectAttendance = async (subjectId) => {
    const response = await apiClient.get(`/student/subject-attendance/${subjectId}`);
    return response.data;
};

// ==================== FACULTY SESSION API ====================

export const getFacultyMappings = async () => {
    const response = await apiClient.get('/faculty/mappings');
    return response.data;
};

export const createSession = async (sessionData) => {
    const response = await apiClient.post('/faculty/sessions', sessionData);
    const data = response.data;
    // Backend returns { sessionId, qrToken, ... } (stable payload)
    if (data && (data.sessionId ?? data.id) != null) {
        return { ...data, id: data.id ?? data.sessionId };
    }
    return data;
};

export const refreshSessionQr = async (sessionId) => {
    const response = await apiClient.post(`/faculty/sessions/${sessionId}/refresh-qr`);
    return response.data;
};

export const endSession = async (sessionId) => {
    if (sessionId === undefined || sessionId === null || sessionId === '' || sessionId === 'undefined') {
        throw new Error('Invalid session id. Please refresh and try again.');
    }
    const response = await apiClient.post(`/faculty/sessions/${sessionId}/end`);
    return response.data;
};

export const cancelSession = async (sessionId) => {
    if (sessionId === undefined || sessionId === null || sessionId === '' || sessionId === 'undefined') {
        throw new Error('Invalid session id. Please refresh and try again.');
    }
    const response = await apiClient.post(`/faculty/sessions/${sessionId}/cancel`);
    return response.data;
};

export const getSessionAttendanceCount = async (sessionId) => {
    const response = await apiClient.get(`/faculty/sessions/${sessionId}/count`);
    return response.data;
};

export const markManualAttendance = async (attendanceData) => {
    const response = await apiClient.post('/faculty/manual-attendance', attendanceData);
    return response.data;
};

export const getSessionAttendance = async (sessionId) => {
    const response = await apiClient.get(`/faculty/sessions/${sessionId}/attendance`);
    return response.data;
};

export const updateAttendanceStatus = async (recordId, status, remarks) => {
    const response = await apiClient.patch(`/faculty/attendance/${recordId}/status`, { status, remarks });
    return response.data;
};

// ==================== FACULTY DASHBOARD & ANALYTICS API ====================

export const getFacultyDashboard = async () => {
    const response = await apiClient.get('/faculty/dashboard');
    return response.data;
};

export const getSessionHistory = async (limit = 50) => {
    const response = await apiClient.get('/faculty/sessions/history', { params: { limit } });
    return response.data;
};

export const getFacultyClassStats = async () => {
    const response = await apiClient.get('/faculty/class-stats');
    return response.data;
};

export const getSessionReport = async (sessionId) => {
    const response = await apiClient.get(`/faculty/sessions/${sessionId}/report`);
    return response.data;
};

// ==================== REPORTING API (HOD & PRINCIPAL) ====================

export const getHodDashboard = async () => {
    const response = await apiClient.get('/reports/hod/dashboard');
    return response.data;
};

export const getPrincipalDashboard = async () => {
    const response = await apiClient.get('/reports/principal/dashboard');
    return response.data;
};

export const getHodFacultyList = async () => {
    const response = await apiClient.get('/reports/hod/faculty-list');
    return response.data;
};

export const getHodStudentList = async (classId) => {
    const params = classId ? { classId } : {};
    const response = await apiClient.get('/reports/hod/student-list', { params });
    return response.data;
};

// ==================== CRC (Class Representative Coordinator) API ====================

export const crcAPI = {
    getMyClasses: async () => {
        const response = await apiClient.get('/crc/my-classes');
        return response.data;
    },
    getClassOverview: async (classId) => {
        const response = await apiClient.get(`/crc/class/${classId}/overview`);
        return response.data;
    },
    getClassStudents: async (classId) => {
        const response = await apiClient.get(`/crc/class/${classId}/students`);
        return response.data;
    },
    getClassSubjects: async (classId) => {
        const response = await apiClient.get(`/crc/class/${classId}/subjects`);
        return response.data;
    },
    getClassDefaulters: async (classId) => {
        const response = await apiClient.get(`/crc/class/${classId}/defaulters`);
        return response.data;
    },
};

export const uploadTimetableImage = async (curriculumId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
        `/admin/data/class-curriculum/${curriculumId}/timetable-image`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

export const uploadClassTimetableFile = async (classId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
        `/admin/data/classes/${classId}/timetable-file`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

export const uploadClassSyllabusFile = async (classId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
        `/admin/data/classes/${classId}/syllabus-file`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
};

// ==================== QR ATTENDANCE API (Student) ====================

export const markQrAttendance = async (qrData) => {
    const response = await apiClient.post('/student/qr-attendance', qrData);
    return response.data;
};

export const getSessionInfoByQr = async (qrToken) => {
    const response = await apiClient.get('/student/session-info', {
        params: { qrToken }
    });
    return response.data;
};

// ==================== BULK UPLOAD API ====================

export const bulkUploadAPI = {
    // Validate student upload
    validateStudentUpload: async (file, targetClassId) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/bulk-upload/students/validate', formData, {
            params: targetClassId ? { targetClassId } : {},
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Confirm student upload
    confirmStudentUpload: async (uploadLogId, targetClassId) => {
        const response = await apiClient.post(`/bulk-upload/students/confirm/${uploadLogId}`, {}, {
            params: targetClassId ? { targetClassId } : {},
        });
        return response.data;
    },

    // Validate faculty upload
    validateFacultyUpload: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/bulk-upload/faculty/validate', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Confirm faculty upload
    confirmFacultyUpload: async (uploadLogId) => {
        const response = await apiClient.post(`/bulk-upload/faculty/confirm/${uploadLogId}`);
        return response.data;
    },

    // Validate attendance upload
    validateAttendanceUpload: async (file, mappingId, date) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/bulk-upload/attendance/validate', formData, {
            params: { mappingId, date },
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Confirm attendance upload
    confirmAttendanceUpload: async (uploadLogId, mappingId, date) => {
        const response = await apiClient.post(`/bulk-upload/attendance/confirm/${uploadLogId}`, {}, {
            params: { mappingId, date },
        });
        return response.data;
    },

    // Validate monthly attendance upload (matrix format: rows=students, columns=dates)
    validateMonthlyAttendance: async (file, mappingId) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/bulk-upload/attendance/monthly/validate', formData, {
            params: { mappingId },
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    // Confirm monthly attendance upload
    confirmMonthlyAttendance: async (uploadLogId, mappingId) => {
        const response = await apiClient.post(`/bulk-upload/attendance/monthly/confirm/${uploadLogId}`, {}, {
            params: { mappingId },
        });
        return response.data;
    },
};

// ==================== STUDENT MANAGEMENT API ====================

export const studentAPI = {
    getAll: async () => {
        const response = await apiClient.get('/students');
        return response.data;
    },
    getById: async (id) => {
        const response = await apiClient.get(`/students/${id}`);
        return response.data;
    },
    getByRollNumber: async (rollNumber) => {
        const response = await apiClient.get(`/students/roll/${rollNumber}`);
        return response.data;
    },
    getByDepartment: async (departmentCode) => {
        const response = await apiClient.get(`/students/department/${departmentCode}`);
        return response.data;
    },
    getBySemester: async (semester) => {
        const response = await apiClient.get(`/students/semester/${semester}`);
        return response.data;
    },
    getByStatus: async (status) => {
        const response = await apiClient.get(`/students/status/${status}`);
        return response.data;
    },
    getByDepartmentAndSemester: async (departmentCode, semester) => {
        const response = await apiClient.get(`/students/department/${departmentCode}/semester/${semester}`);
        return response.data;
    },
    create: async (studentData) => {
        const response = await apiClient.post('/students', studentData);
        return response.data;
    },
    update: async (id, studentData) => {
        const response = await apiClient.put(`/students/${id}`, studentData);
        return response.data;
    },
    updateStatus: async (id, status) => {
        const response = await apiClient.patch(`/students/${id}/status`, null, {
            params: { status },
        });
        return response.data;
    },
    delete: async (id) => {
        const response = await apiClient.delete(`/students/${id}`);
        return response.data;
    },
};

// ==================== FACULTY MANAGEMENT API ====================

export const facultyAPI = {
    getAll: async () => {
        const response = await apiClient.get('/faculty');
        return response.data;
    },
    getById: async (id) => {
        const response = await apiClient.get(`/faculty/${id}`);
        return response.data;
    },
    getByFacultyId: async (facultyId) => {
        const response = await apiClient.get(`/faculty/faculty-id/${facultyId}`);
        return response.data;
    },
    getByDepartment: async (departmentCode) => {
        const response = await apiClient.get(`/faculty/department/${departmentCode}`);
        return response.data;
    },
    getByStatus: async (status) => {
        const response = await apiClient.get(`/faculty/status/${status}`);
        return response.data;
    },
    getByRole: async (role) => {
        const response = await apiClient.get(`/faculty/role/${role}`);
        return response.data;
    },
    create: async (facultyData) => {
        const response = await apiClient.post('/faculty', facultyData);
        return response.data;
    },
    update: async (id, facultyData) => {
        const response = await apiClient.put(`/faculty/${id}`, facultyData);
        return response.data;
    },
    updateStatus: async (id, status) => {
        const response = await apiClient.patch(`/faculty/${id}/status`, null, {
            params: { status },
        });
        return response.data;
    },
    delete: async (id) => {
        const response = await apiClient.delete(`/faculty/${id}`);
        return response.data;
    },
};

// ==================== PROMOTION API ====================

export const promotionAPI = {
    execute: async (departmentCode, currentSemester, academicYear, promotionData) => {
        const response = await apiClient.post('/promotion/execute', promotionData, {
            params: { departmentCode, currentSemester, academicYear },
        });
        return response.data;
    },
    reverse: async (departmentCode, semester, academicYear) => {
        const response = await apiClient.post('/promotion/reverse', null, {
            params: { departmentCode, semester, academicYear },
        });
        return response.data;
    },
    getEligibleStudents: async (departmentCode, semester) => {
        const response = await apiClient.get('/promotion/eligible', {
            params: { departmentCode, semester },
        });
        return response.data;
    },
    getStudentHistory: async (studentId) => {
        const response = await apiClient.get(`/promotion/history/student/${studentId}`);
        return response.data;
    },
    getStatistics: async (departmentCode, academicYear) => {
        const response = await apiClient.get('/promotion/statistics', {
            params: { departmentCode, academicYear },
        });
        return response.data;
    },
};

// ==================== DEPARTMENT API ====================

export const departmentAPI = {
    getAll: async () => {
        const response = await apiClient.get('/departments');
        return response.data;
    },
    getActive: async () => {
        const response = await apiClient.get('/departments/active');
        return response.data;
    },
    getById: async (id) => {
        const response = await apiClient.get(`/departments/${id}`);
        return response.data;
    },
    getByCode: async (code) => {
        const response = await apiClient.get(`/departments/code/${code}`);
        return response.data;
    },
    create: async (departmentData) => {
        const response = await apiClient.post('/departments', departmentData);
        return response.data;
    },
    update: async (id, departmentData) => {
        const response = await apiClient.put(`/departments/${id}`, departmentData);
        return response.data;
    },
    setStatus: async (id, active) => {
        const response = await apiClient.patch(`/departments/${id}/status`, null, {
            params: { active },
        });
        return response.data;
    },
    setHOD: async (departmentId, facultyId) => {
        const response = await apiClient.patch(`/departments/${departmentId}/hod/${facultyId}`);
        return response.data;
    },
    getProgramsByDepartment: async (departmentId) => {
        const response = await apiClient.get(`/departments/${departmentId}/programs`);
        return response.data;
    },
    getAllPrograms: async () => {
        const response = await apiClient.get('/departments/programs');
        return response.data;
    },
    getActivePrograms: async () => {
        const response = await apiClient.get('/departments/programs/active');
        return response.data;
    },
    createProgram: async (departmentId, code, name, type, duration) => {
        const response = await apiClient.post(`/departments/${departmentId}/programs`, null, {
            params: { code, name, type, duration },
        });
        return response.data;
    },
    setProgramStatus: async (programId, active) => {
        const response = await apiClient.patch(`/departments/programs/${programId}/status`, null, {
            params: { active },
        });
        return response.data;
    },
};

// ==================== SUBJECT ELIGIBILITY & ASSIGNMENT API ====================

export const subjectAPI = {
    addEligibility: async (facultyId, subjectId) => {
        const response = await apiClient.post('/subjects/eligibility', null, {
            params: { facultyId, subjectId },
        });
        return response.data;
    },
    removeEligibility: async (eligibilityId) => {
        const response = await apiClient.delete(`/subjects/eligibility/${eligibilityId}`);
        return response.data;
    },
    getEligibleSubjects: async (facultyId) => {
        const response = await apiClient.get(`/subjects/eligibility/faculty/${facultyId}/subjects`);
        return response.data;
    },
    getEligibleFaculty: async (subjectId) => {
        const response = await apiClient.get(`/subjects/eligibility/subject/${subjectId}/faculty`);
        return response.data;
    },
    bulkAddEligibilities: async (facultyId, subjectIds) => {
        const response = await apiClient.post('/subjects/eligibility/bulk', subjectIds, {
            params: { facultyId },
        });
        return response.data;
    },
    assignSubject: async (facultyId, subjectId, section, academicYear, semester) => {
        const response = await apiClient.post('/subjects/assignments', null, {
            params: { facultyId, subjectId, section, academicYear, semester },
        });
        return response.data;
    },
    unassignSubject: async (assignmentId) => {
        const response = await apiClient.delete(`/subjects/assignments/${assignmentId}`);
        return response.data;
    },
    lockAssignment: async (assignmentId) => {
        const response = await apiClient.patch(`/subjects/assignments/${assignmentId}/lock`);
        return response.data;
    },
    unlockAssignment: async (assignmentId) => {
        const response = await apiClient.patch(`/subjects/assignments/${assignmentId}/unlock`);
        return response.data;
    },
    getFacultyAssignments: async (facultyId) => {
        const response = await apiClient.get(`/subjects/assignments/faculty/${facultyId}`);
        return response.data;
    },
    getSubjectAssignments: async (subjectId) => {
        const response = await apiClient.get(`/subjects/assignments/subject/${subjectId}`);
        return response.data;
    },
    getFacultyWorkload: async (facultyId) => {
        const response = await apiClient.get(`/subjects/assignments/faculty/${facultyId}/workload`);
        return response.data;
    },
    reassignSubject: async (assignmentId, newFacultyId) => {
        const response = await apiClient.patch(`/subjects/assignments/${assignmentId}/reassign`, null, {
            params: { newFacultyId },
        });
        return response.data;
    },
};

// ==================== ADMIN DASHBOARD API ====================

export const uploadStudents = async (formData) => {
    const response = await apiClient.post('/admin/upload/students', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const uploadFaculty = async (formData) => {
    const response = await apiClient.post('/admin/upload/faculty', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const createClass = async (classData) => {
    const response = await apiClient.post('/admin/classes', classData);
    return response.data;
};

export const getClasses = async () => {
    const response = await apiClient.get('/admin/classes');
    return response.data;
};

export const getAdminStats = async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
};

export const deleteClass = async (classId) => {
    const response = await apiClient.delete(`/admin/classes/${classId}`);
    return response.data;
};

export const resetAllUsers = async () => {
    const response = await apiClient.post('/admin/reset-users');
    return response.data;
};

// ==================== USER PROFILE API ====================

export const getUserProfile = async () => {
    const response = await apiClient.get('/me');
    return response.data;
};

export const updateProfileImage = async (formData) => {
    const response = await apiClient.put('/me/profile-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const removeProfileImage = async () => {
    const response = await apiClient.delete('/me/profile-image');
    return response.data;
};

export const updateUserProfile = async (profileData) => {
    const response = await apiClient.put('/me', profileData);
    return response.data;
};

export const adminDataAPI = {
    request: async (method, path, body, params) => {
        const response = await apiClient.request({
            method,
            url: `/admin/data${path}`,
            data: body,
            params: params,
        });
        return response.data;
    },
};

export const triggerFullSeed = async () => {
    const response = await apiClient.post('/admin/data/system/seed');
    return response.data;
};

export default apiClient;
