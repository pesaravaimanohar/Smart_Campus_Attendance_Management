package com.college.smartattendance.service;

import com.college.smartattendance.dto.BulkUploadValidationResult;
import com.college.smartattendance.dto.ValidationError;
import com.college.smartattendance.dto.ValidRecordPreview;
import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class BulkUploadService {

    @Autowired
    private BulkUploadLogRepository bulkUploadLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private TempUploadDataRepository tempUploadDataRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserService userService;

    @Autowired
    private AuditService auditService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern MOBILE_PATTERN = Pattern.compile("^[0-9]{10}$");

    /**
     * STEP 1: Validate student upload and create preview
     */
    public BulkUploadValidationResult validateStudentUpload(MultipartFile file, Long uploadedBy) throws IOException {
        BulkUploadLog log = new BulkUploadLog(UploadType.STUDENT, uploadedBy, file.getOriginalFilename());
        log = bulkUploadLogRepository.save(log);

        BulkUploadValidationResult result = new BulkUploadValidationResult();
        result.setUploadLogId(log.getId());
        result.setFileName(file.getOriginalFilename());

        List<ValidRecordPreview> validRecords = new ArrayList<>();
        List<ValidationError> errors = new ArrayList<>();
        int totalRecords = 0;

        try {
            List<Map<String, String>> rows = parseFile(file);
            for (Map<String, String> studentData : rows) {
                int rowNumber = totalRecords + 2; // 1-indexed, skip header
                totalRecords++;
                try {
                    validateStudentData(studentData, rowNumber, errors);
                    if (errors.stream().noneMatch(e -> e.getRowNumber().equals(rowNumber))) {
                        validRecords.add(new ValidRecordPreview(rowNumber, studentData));
                        String dataJson = objectMapper.writeValueAsString(studentData);
                        TempUploadData tempData = new TempUploadData(log.getId(), rowNumber, dataJson);
                        tempUploadDataRepository.save(tempData);
                    }
                } catch (Exception e) {
                    errors.add(new ValidationError(rowNumber, "GENERAL", "Parse error: " + e.getMessage()));
                }
            }
        } catch (Exception e) {
            errors.add(new ValidationError(0, "FILE", "Could not read file: " + e.getMessage()));
        }

        result.setTotalRecords(totalRecords);
        result.setValidRecords(validRecords.size());
        result.setInvalidRecords(errors.size());
        result.setValidData(validRecords);
        result.setErrors(errors);

        // Update log
        log.setTotalRecords(totalRecords);
        log.setValidRecords(validRecords.size());
        log.setInvalidRecords(errors.size());
        log.setStatus(errors.isEmpty() && validRecords.size() > 0 ? UploadStatus.VALIDATED : UploadStatus.FAILED);

        try {
            log.setErrorSummary(objectMapper.writeValueAsString(errors));
        } catch (JsonProcessingException e) {
            log.setErrorSummary("Error serializing validation errors");
        }

        bulkUploadLogRepository.save(log);

        return result;
    }

    /**
     * STEP 2: Confirm and execute student upload
     */
    @Transactional(rollbackFor = Exception.class)
    public int confirmStudentUpload(Long uploadLogId, Long confirmedBy) {
        BulkUploadLog log = bulkUploadLogRepository.findById(uploadLogId)
                .orElseThrow(() -> new RuntimeException("Upload log not found"));

        if (log.getStatus() != UploadStatus.VALIDATED) {
            throw new RuntimeException("Upload must be validated before confirmation");
        }

        if (log.getValidRecords() == 0) {
            throw new RuntimeException("No valid records to import");
        }

        // Retrieve temp data
        List<TempUploadData> tempDataList = tempUploadDataRepository.findByUploadLogIdOrderByRowNum(uploadLogId);

        if (tempDataList.isEmpty()) {
            throw new RuntimeException("No temporary data found. Please re-validate upload.");
        }

        int count = 0;
        List<Long> importedIds = new ArrayList<>();

        try {
            for (TempUploadData tempData : tempDataList) {
                Map<String, String> data = objectMapper.readValue(
                        tempData.getDataJson(),
                        new TypeReference<Map<String, String>>() {
                        });

                String rollNumber = data.get("rollNumber");

                // Double-check not already exists (could have been imported between validate
                // and confirm)
                if (userRepository.existsByUsername(rollNumber)) {
                    continue;
                }

                User user = createUserFromStudentData(data);
                user = userRepository.save(user);

                Student student = createStudentFromData(data, user);
                student = studentRepository.save(student);

                importedIds.add(student.getId());
                count++;
            }

            // Update log status
            log.setStatus(UploadStatus.CONFIRMED);
            bulkUploadLogRepository.save(log);

            // Audit log
            auditService.logAction(confirmedBy, "BulkUpload", uploadLogId, "STUDENT_UPLOAD_CONFIRMED",
                    null, count + " students imported", null);

            // Clean up temp data
            tempUploadDataRepository.deleteByUploadLogId(uploadLogId);

            return count;

        } catch (Exception e) {
            // Transaction will rollback automatically
            log.setStatus(UploadStatus.FAILED);
            bulkUploadLogRepository.save(log);
            throw new RuntimeException("Import failed: " + e.getMessage(), e);
        }
    }

    /**
     * Internal method - no longer needed, moved to confirmStudentUpload
     */
    @Deprecated
    @Transactional
    protected int executeStudentImport(List<Map<String, String>> validData, Long uploadLogId, Long importedBy) {
        int count = 0;

        for (Map<String, String> data : validData) {
            try {
                String rollNumber = data.get("rollNumber");

                // Skip if already exists
                if (userRepository.existsByUsername(rollNumber)) {
                    continue;
                }

                User user = createUserFromStudentData(data);
                user = userRepository.save(user);

                Student student = createStudentFromData(data, user);
                studentRepository.save(student);

                // Audit log
                auditService.logAction(importedBy, "Student", student.getId(), "BULK_UPLOAD");

                count++;
            } catch (Exception e) {
                // Log error but continue with others
                System.err.println("Error importing student: " + e.getMessage());
            }
        }

        // Update upload log
        BulkUploadLog log = bulkUploadLogRepository.findById(uploadLogId).orElse(null);
        if (log != null) {
            log.setStatus(UploadStatus.CONFIRMED);
            bulkUploadLogRepository.save(log);
        }

        // Audit the bulk upload
        auditService.logAction(importedBy, "BulkUpload", uploadLogId, "CONFIRMED",
                null, count + " students imported", null);

        return count;
    }

    /**
     * STEP 1: Validate faculty upload and create preview
     */
    public BulkUploadValidationResult validateFacultyUpload(MultipartFile file, Long uploadedBy) throws IOException {
        BulkUploadLog log = new BulkUploadLog(UploadType.FACULTY, uploadedBy, file.getOriginalFilename());
        log = bulkUploadLogRepository.save(log);

        BulkUploadValidationResult result = new BulkUploadValidationResult();
        result.setUploadLogId(log.getId());
        result.setFileName(file.getOriginalFilename());

        List<ValidRecordPreview> validRecords = new ArrayList<>();
        List<ValidationError> errors = new ArrayList<>();
        int totalRecords = 0;

        try {
            List<Map<String, String>> rows = parseFile(file);
            for (Map<String, String> facultyData : rows) {
                int rowNumber = totalRecords + 2;
                totalRecords++;
                try {
                    validateFacultyData(facultyData, rowNumber, errors);
                    if (errors.stream().noneMatch(e -> e.getRowNumber().equals(rowNumber))) {
                        validRecords.add(new ValidRecordPreview(rowNumber, facultyData));
                        String dataJson = objectMapper.writeValueAsString(facultyData);
                        TempUploadData tempData = new TempUploadData(log.getId(), rowNumber, dataJson);
                        tempUploadDataRepository.save(tempData);
                    }
                } catch (Exception e) {
                    errors.add(new ValidationError(rowNumber, "GENERAL", "Parse error: " + e.getMessage()));
                }
            }
        } catch (Exception e) {
            errors.add(new ValidationError(0, "FILE", "Could not read file: " + e.getMessage()));
        }

        result.setTotalRecords(totalRecords);
        result.setValidRecords(validRecords.size());
        result.setInvalidRecords(errors.size());
        result.setValidData(validRecords);
        result.setErrors(errors);

        // Update log
        log.setTotalRecords(totalRecords);
        log.setValidRecords(validRecords.size());
        log.setInvalidRecords(errors.size());
        log.setStatus(UploadStatus.VALIDATED);

        try {
            log.setErrorSummary(objectMapper.writeValueAsString(errors));
        } catch (JsonProcessingException e) {
            log.setErrorSummary("Error serializing validation errors");
        }

        bulkUploadLogRepository.save(log);

        return result;
    }

    /**
     * STEP 2: Confirm and execute faculty upload
     */
    @Transactional(rollbackFor = Exception.class)
    public int confirmFacultyUpload(Long uploadLogId, Long confirmedBy) {
        BulkUploadLog log = bulkUploadLogRepository.findById(uploadLogId)
                .orElseThrow(() -> new RuntimeException("Upload log not found"));

        if (log.getStatus() != UploadStatus.VALIDATED) {
            throw new RuntimeException("Upload must be validated before confirmation");
        }

        if (log.getValidRecords() == 0) {
            throw new RuntimeException("No valid records to import");
        }

        // Retrieve temp data
        List<TempUploadData> tempDataList = tempUploadDataRepository.findByUploadLogIdOrderByRowNum(uploadLogId);

        if (tempDataList.isEmpty()) {
            throw new RuntimeException("No temporary data found. Please re-validate upload.");
        }

        int count = 0;

        try {
            for (TempUploadData tempData : tempDataList) {
                Map<String, String> data = objectMapper.readValue(
                        tempData.getDataJson(),
                        new TypeReference<Map<String, String>>() {
                        });

                String facultyId = data.get("facultyId");

                // Double-check not already exists
                if (userRepository.existsByUsername(facultyId)) {
                    continue;
                }

                User user = createUserFromFacultyData(data);
                user = userRepository.save(user);

                Faculty faculty = createFacultyFromData(data, user);
                facultyRepository.save(faculty);

                count++;
            }

            // Update log status
            log.setStatus(UploadStatus.CONFIRMED);
            bulkUploadLogRepository.save(log);

            // Audit log
            auditService.logAction(confirmedBy, "BulkUpload", uploadLogId, "FACULTY_UPLOAD_CONFIRMED",
                    null, count + " faculty imported", null);

            // Clean up temp data
            tempUploadDataRepository.deleteByUploadLogId(uploadLogId);

            return count;

        } catch (Exception e) {
            // Transaction will rollback automatically
            log.setStatus(UploadStatus.FAILED);
            bulkUploadLogRepository.save(log);
            throw new RuntimeException("Import failed: " + e.getMessage(), e);
        }
    }

    // ==================== FILE TYPE DETECTION ====================

    /**
     * Detects whether the uploaded file is CSV or XLSX and returns
     * a list of row maps keyed by the header column names.
     */
    private List<Map<String, String>> parseFile(MultipartFile file) throws IOException {
        String name = file.getOriginalFilename();
        if (name != null && name.toLowerCase().endsWith(".csv")) {
            return parseCsv(file);
        } else {
            return parseXlsx(file);
        }
    }

    /** Parse CSV — first row is header, remaining rows are data */
    private List<Map<String, String>> parseCsv(MultipartFile file) throws IOException {
        List<Map<String, String>> result = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return result;
            String[] headers = headerLine.split(",", -1);
            for (int i = 0; i < headers.length; i++) headers[i] = headers[i].trim();

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) continue;
                String[] values = line.split(",", -1);
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.length; i++) {
                    row.put(headers[i], i < values.length ? values[i].trim() : "");
                }
                // Map CSV column names to the internal keys expected by validate methods
                normalizeKeys(row);
                result.add(row);
            }
        }
        return result;
    }

    /** Parse XLSX — first row is header, remaining rows are data */
    private List<Map<String, String>> parseXlsx(MultipartFile file) throws IOException {
        List<Map<String, String>> result = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIter = sheet.iterator();
            if (!rowIter.hasNext()) return result;

            // Read header row
            Row headerRow = rowIter.next();
            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) headers.add(getCellValue(cell).trim());

            while (rowIter.hasNext()) {
                Row currentRow = rowIter.next();
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    row.put(headers.get(i), getCellValue(currentRow.getCell(i)));
                }
                normalizeKeys(row);
                result.add(row);
            }
        }
        return result;
    }

    /**
     * Normalises common alternate column name spellings to the internal keys
     * that validateStudentData / validateFacultyData expect.
     */
    private void normalizeKeys(Map<String, String> row) {
        remap(row, "fullName",        "firstName", "lastName");  // handled below
        remap(row, "mobile",          "contactNumber", "phone", "mobileNumber");
        remap(row, "semester",        "currentSemester");
        remap(row, "program",         "programType");
        // If firstName+lastName present but fullName missing, build fullName
        if (!row.containsKey("fullName") && row.containsKey("firstName")) {
            String fn = row.getOrDefault("firstName", "");
            String ln = row.getOrDefault("lastName", "");
            row.put("fullName", (fn + " " + ln).trim());
        }
        // If fullName present but firstName missing, split it
        if (row.containsKey("fullName") && !row.containsKey("firstName")) {
            String[] parts = row.get("fullName").split(" ", 2);
            row.putIfAbsent("firstName", parts[0]);
            row.putIfAbsent("lastName", parts.length > 1 ? parts[1] : "");
        }
    }

    /** Copy value from any of the altKeys into key if key is missing */
    private void remap(Map<String, String> row, String key, String... altKeys) {
        if (row.containsKey(key)) return;
        for (String alt : altKeys) {
            if (row.containsKey(alt)) { row.put(key, row.get(alt)); return; }
        }
    }

    // ==================== PARSING METHODS (legacy, kept for reference) ====================

    private Map<String, String> parseStudentRow(Row row, int rowNumber, List<ValidationError> errors) {
        Map<String, String> data = new HashMap<>();

        // Column 0: Roll Number
        String rollNumber = getCellValue(row.getCell(0));
        if (rollNumber.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "rollNumber", "Roll number is required"));
            return null;
        }
        data.put("rollNumber", rollNumber);

        // Column 1: Full Name
        String fullName = getCellValue(row.getCell(1));
        if (fullName.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "fullName", "Full name is required"));
            return null;
        }
        data.put("fullName", fullName);

        // Column 2: DOB
        data.put("dob", getCellValue(row.getCell(2)));

        // Column 3: Department Code
        String deptCode = getCellValue(row.getCell(3));
        if (deptCode.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "department", "Department is required"));
        }
        data.put("departmentCode", deptCode);

        // Column 4: Program (UG/PG)
        data.put("program", getCellValue(row.getCell(4)));

        // Column 5: Admission Year
        data.put("admissionYear", getCellValue(row.getCell(5)));

        // Column 6: Semester
        data.put("semester", getCellValue(row.getCell(6)));

        // Column 7: Section
        data.put("section", getCellValue(row.getCell(7)));

        // Column 8: Gender
        data.put("gender", getCellValue(row.getCell(8)));

        // Column 9: Mobile
        data.put("mobile", getCellValue(row.getCell(9)));

        // Column 10: Email
        data.put("email", getCellValue(row.getCell(10)));

        return data;
    }

    private Map<String, String> parseFacultyRow(Row row, int rowNumber, List<ValidationError> errors) {
        Map<String, String> data = new HashMap<>();

        // Column 0: Employee ID (Faculty ID)
        String facultyId = getCellValue(row.getCell(0));
        if (facultyId.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "facultyId", "Faculty ID is required"));
            return null;
        }
        data.put("facultyId", facultyId);

        // Column 1: Full Name
        String fullName = getCellValue(row.getCell(1));
        if (fullName.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "fullName", "Full name is required"));
            return null;
        }
        data.put("fullName", fullName);

        // Column 2: DOB
        data.put("dob", getCellValue(row.getCell(2)));

        // Column 3: Department Code
        String deptCode = getCellValue(row.getCell(3));
        if (deptCode.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "department", "Department is required"));
        }
        data.put("departmentCode", deptCode);

        // Column 4: Designation
        data.put("designation", getCellValue(row.getCell(4)));

        // Column 5: Role
        data.put("role", getCellValue(row.getCell(5)));

        // Column 6: Gender
        data.put("gender", getCellValue(row.getCell(6)));

        // Column 7: Mobile
        data.put("mobile", getCellValue(row.getCell(7)));

        // Column 8: Email
        data.put("email", getCellValue(row.getCell(8)));

        // Column 9: Joining Date
        data.put("joiningDate", getCellValue(row.getCell(9)));

        // Column 10: Qualifications
        data.put("qualifications", getCellValue(row.getCell(10)));

        return data;
    }

    // ==================== VALIDATION METHODS ====================

    private void validateStudentData(Map<String, String> data, int rowNumber, List<ValidationError> errors) {
        String rollNumber = data.get("rollNumber");
        String email = data.get("email");
        String mobile = data.get("mobile");
        String deptCode = data.get("departmentCode");
        String program = data.get("program");

        // Check duplicate roll number
        if (userRepository.existsByUsername(rollNumber)) {
            errors.add(new ValidationError(rowNumber, "rollNumber", "Roll number already exists: " + rollNumber));
        }

        // Check duplicate email
        if (!email.isEmpty() && userRepository.existsByEmail(email)) {
            errors.add(new ValidationError(rowNumber, "email", "Email already exists: " + email));
        }

        // Validate email format
        if (!email.isEmpty() && !EMAIL_PATTERN.matcher(email).matches()) {
            errors.add(new ValidationError(rowNumber, "email", "Invalid email format: " + email));
        }

        // Validate mobile format
        if (!mobile.isEmpty() && !MOBILE_PATTERN.matcher(mobile).matches()) {
            errors.add(
                    new ValidationError(rowNumber, "mobile", "Invalid mobile number (must be 10 digits): " + mobile));
        }

        // Validate department exists
        if (!deptCode.isEmpty() && !departmentRepository.existsByCode(deptCode)) {
            errors.add(new ValidationError(rowNumber, "department", "Department not found: " + deptCode));
        }

        // Validate program type
        if (!program.isEmpty() && !program.equalsIgnoreCase("UG") && !program.equalsIgnoreCase("PG")) {
            errors.add(new ValidationError(rowNumber, "program", "Program must be UG or PG: " + program));
        }
    }

    private void validateFacultyData(Map<String, String> data, int rowNumber, List<ValidationError> errors) {
        String facultyId = data.get("facultyId");
        String email = data.get("email");
        String mobile = data.get("mobile");
        String deptCode = data.get("departmentCode");
        String role = data.get("role");

        // Check duplicate faculty ID
        if (userRepository.existsByUsername(facultyId)) {
            errors.add(new ValidationError(rowNumber, "facultyId", "Faculty ID already exists: " + facultyId));
        }

        // Check duplicate email
        if (!email.isEmpty() && userRepository.existsByEmail(email)) {
            errors.add(new ValidationError(rowNumber, "email", "Email already exists: " + email));
        }

        // Validate email format
        if (!email.isEmpty() && !EMAIL_PATTERN.matcher(email).matches()) {
            errors.add(new ValidationError(rowNumber, "email", "Invalid email format: " + email));
        }

        // Validate mobile format
        if (!mobile.isEmpty() && !MOBILE_PATTERN.matcher(mobile).matches()) {
            errors.add(
                    new ValidationError(rowNumber, "mobile", "Invalid mobile number (must be 10 digits): " + mobile));
        }

        // Validate department exists
        if (!deptCode.isEmpty() && !departmentRepository.existsByCode(deptCode)) {
            errors.add(new ValidationError(rowNumber, "department", "Department not found: " + deptCode));
        }

        // Validate role
        if (!role.isEmpty()) {
            try {
                Role.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                errors.add(new ValidationError(rowNumber, "role",
                        "Invalid role: " + role + ". Must be FACULTY, HOD, or PRINCIPAL"));
            }
        }
    }

    // ==================== HELPER METHODS ====================

    private User createUserFromStudentData(Map<String, String> data) {
        String fullName = data.get("fullName");
        String[] nameParts = fullName.split(" ", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        User user = new User();
        user.setUsername(data.get("rollNumber"));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(data.get("email"));
        user.setContactNumber(data.get("mobile"));
        user.setGender(data.get("gender"));
        user.setRole(Role.STUDENT);
        user.setFirstLogin(true);

        // Parse DOB
        LocalDate dob = parseDateString(data.get("dob"));
        user.setDob(dob);

        // Generate password
        String rawPassword = userService.generateDefaultPassword(user);
        user.setPassword(passwordEncoder.encode(rawPassword));

        return user;
    }

    private Student createStudentFromData(Map<String, String> data, User user) {
        Student student = new Student();
        student.setUser(user);
        student.setRollNumber(data.get("rollNumber"));
        student.setDepartment(data.get("departmentCode")); // Legacy field

        // Set program
        String programStr = data.get("program");
        if (!programStr.isEmpty()) {
            student.setProgram(ProgramType.valueOf(programStr.toUpperCase()));
        }

        // Set semester
        String semesterStr = data.get("semester");
        if (!semesterStr.isEmpty()) {
            try {
                student.setCurrentSemester(Integer.parseInt(semesterStr));
            } catch (NumberFormatException e) {
                student.setCurrentSemester(1);
            }
        }

        student.setSection(data.get("section"));
        student.setStatus(StudentStatus.ACTIVE);

        // Admission year
        String admYearStr = data.get("admissionYear");
        if (!admYearStr.isEmpty()) {
            try {
                student.setAdmissionYear(Integer.parseInt(admYearStr));
            } catch (NumberFormatException e) {
                student.setAdmissionYear(LocalDate.now().getYear());
            }
        }

        return student;
    }

    private LocalDate parseDateString(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return LocalDate.of(2000, 1, 1);
        }

        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return LocalDate.of(2000, 1, 1);
        }
    }

    private String getCellValue(Cell cell) {
        if (cell == null)
            return "";

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toInstant()
                            .atZone(ZoneId.systemDefault())
                            .toLocalDate()
                            .toString();
                }
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }

    private User createUserFromFacultyData(Map<String, String> data) {
        String fullName = data.get("fullName");
        String[] nameParts = fullName.split(" ", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        User user = new User();
        user.setUsername(data.get("facultyId"));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(data.get("email"));
        user.setContactNumber(data.get("mobile"));
        user.setGender(data.get("gender"));

        // Parse role
        String roleStr = data.get("role");
        if (roleStr != null && !roleStr.isEmpty()) {
            user.setRole(Role.valueOf(roleStr.toUpperCase()));
        } else {
            user.setRole(Role.FACULTY);
        }

        user.setFirstLogin(true);

        // Parse DOB
        LocalDate dob = parseDateString(data.get("dob"));
        user.setDob(dob);

        // Generate password
        String rawPassword = userService.generateDefaultPassword(user);
        user.setPassword(passwordEncoder.encode(rawPassword));

        return user;
    }

    private Faculty createFacultyFromData(Map<String, String> data, User user) {
        Faculty faculty = new Faculty();
        faculty.setUser(user);
        faculty.setFacultyId(data.get("facultyId"));
        faculty.setDepartment(data.get("departmentCode")); // Legacy field
        faculty.setDesignation(data.get("designation"));
        faculty.setQualifications(data.get("qualifications"));
        faculty.setEmploymentStatus(EmploymentStatus.ACTIVE);

        // Parse joining date
        String joiningDateStr = data.get("joiningDate");
        if (joiningDateStr != null && !joiningDateStr.isEmpty()) {
            faculty.setJoiningDate(parseDateString(joiningDateStr));
        }

        return faculty;
    }
}
