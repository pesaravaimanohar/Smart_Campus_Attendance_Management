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
    private AuditService auditService;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private AcademicYearRepository academicYearRepository;

    @Autowired
    private StudentClassMapRepository studentClassMapRepository;

    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private FacultySubjectMapRepository facultySubjectMapRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern MOBILE_PATTERN = Pattern.compile("^[0-9]{10}$");

    /**
     * STEP 1: Validate student upload and create preview
     */
    public BulkUploadValidationResult validateStudentUpload(MultipartFile file, Long uploadedBy, Long targetClassId) throws IOException {
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
            CourseClass targetClass = targetClassId != null ? courseClassRepository.findById(targetClassId).orElse(null) : null;
            
            for (Map<String, String> studentData : rows) {
                int rowNumber = totalRecords + 2; // 1-indexed, skip header
                
                // Skip empty rows (where all essential fields are empty)
                String roll = studentData.getOrDefault("rollNumber", "").trim();
                String fName = studentData.getOrDefault("firstName", "").trim();
                String lName = studentData.getOrDefault("lastName", "").trim();
                if (roll.isEmpty() && fName.isEmpty() && lName.isEmpty()) {
                    continue; 
                }
                
                totalRecords++;
                try {
                    validateStudentData(studentData, rowNumber, errors, targetClass);
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

        log.setErrorSummary(serializeErrors(errors));

        bulkUploadLogRepository.save(log);

        return result;
    }

    /**
     * STEP 2: Confirm and execute student upload
     */
    @Transactional
    public int confirmStudentUpload(Long uploadLogId, Long confirmedBy, Long targetClassId) {
        BulkUploadLog log = bulkUploadLogRepository.findById(uploadLogId).orElse(null);
        if (log == null) {
            throw new RuntimeException("Upload log not found");
        }

        List<TempUploadData> tempDataList = tempUploadDataRepository.findByUploadLogIdOrderByRowNum(uploadLogId);
        if (tempDataList.isEmpty()) {
            throw new RuntimeException("No temporary data found. Please re-validate upload.");
        }

        int count = 0;
        try {
            // Get active year for class mapping
            AcademicYear activeYear = academicYearRepository.findByActiveTrue()
                .orElseGet(() -> academicYearRepository.findAll().stream()
                        .sorted((a, b) -> b.getName().compareTo(a.getName()))
                        .findFirst()
                        .orElse(null));
            
            for (TempUploadData tempData : tempDataList) {
                Map<String, String> data = objectMapper.readValue(
                        tempData.getDataJson(),
                        new TypeReference<Map<String, String>>() {
                        });

                String rollNumber = data.getOrDefault("rollNumber", "").trim();
                String username = rollNumber.toLowerCase();

                // Check if user already exists
                User user = userRepository.findByUsername(username).orElse(null);
                if (user == null) {
                    user = createUserFromStudentData(data);
                    user = userRepository.save(user);
                }

                Student student = studentRepository.findByUser(user).orElse(null);
                if (student == null) {
                    student = createStudentFromData(data, user);
                    student = studentRepository.save(student);
                }

                // Link to class - ALWAYS try to create mapping if targetClassId is provided
                if (targetClassId != null) {
                    System.out.println("BULK_IMPORT: Linking student " + rollNumber + " (ID:" + student.getId() + ") to class " + targetClassId);
                    
                    // Check if student is already in a class for the current academic year
                    Optional<StudentClassMap> existingMap = studentClassMapRepository.findByStudentAndAcademicYear(student, activeYear);
                    
                    if (existingMap.isEmpty()) {
                        CourseClass targetClass = courseClassRepository.findById(targetClassId).orElse(null);
                        if (targetClass != null) {
                            StudentClassMap map = new StudentClassMap();
                            map.setStudent(student);
                            map.setCourseClass(targetClass);
                            if (activeYear != null) {
                                map.setAcademicYear(activeYear);
                            } else {
                                // Create a fallback academic year if none exists
                                AcademicYear fallback = new AcademicYear();
                                fallback.setName("2025-2026");
                                fallback.setActive(true);
                                fallback = academicYearRepository.save(fallback);
                                map.setAcademicYear(fallback);
                            }
                            studentClassMapRepository.save(map);
                            System.out.println("BULK_IMPORT: Created StudentClassMap for student " + rollNumber + " -> class " + targetClass.getName());
                        } else {
                            System.err.println("BULK_IMPORT: Target class " + targetClassId + " not found!");
                        }
                    } else {
                        System.out.println("BULK_IMPORT: Mapping already exists for student " + rollNumber + " -> class " + targetClassId);
                    }
                } else {
                    System.out.println("BULK_IMPORT: No targetClassId provided, skipping class mapping for " + rollNumber);
                }

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
                String rollNumber = data.getOrDefault("rollNumber", "").trim();
                String username = rollNumber.toLowerCase();

                // Skip if already exists
                if (userRepository.existsByUsername(username)) {
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
                
                // Skip empty rows (where all essential fields are empty)
                String facId = facultyData.getOrDefault("facultyId", "").trim();
                String fName = facultyData.getOrDefault("firstName", "").trim();
                String lName = facultyData.getOrDefault("lastName", "").trim();
                if (facId.isEmpty() && fName.isEmpty() && lName.isEmpty()) {
                    continue; 
                }
                
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

        log.setErrorSummary(serializeErrors(errors));

        bulkUploadLogRepository.save(log);

        return result;
    }

    /**
     * STEP 2: Confirm and execute faculty upload
     */
    @Transactional
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

                String facultyId = data.getOrDefault("facultyId", "").trim();
                String username = facultyId.toLowerCase();

                // Double-check not already exists
                if (userRepository.existsByUsername(username)) {
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

    /**
     * STEP 1: Validate attendance upload
     */
    public BulkUploadValidationResult validateAttendanceUpload(MultipartFile file, Long uploadedBy, Long mappingId, String dateStr) throws IOException {
        BulkUploadLog log = new BulkUploadLog(UploadType.ATTENDANCE, uploadedBy, file.getOriginalFilename());
        log = bulkUploadLogRepository.save(log);

        BulkUploadValidationResult result = new BulkUploadValidationResult();
        result.setUploadLogId(log.getId());
        result.setFileName(file.getOriginalFilename());

        List<ValidRecordPreview> validRecords = new ArrayList<>();
        List<ValidationError> errors = new ArrayList<>();
        int totalRecords = 0;

        LocalDate defaultDate = null;
        try {
            if (dateStr != null && !dateStr.isEmpty()) defaultDate = LocalDate.parse(dateStr);
        } catch (Exception e) {
            // Invalid dateStr format, but we'll check rows later
        }

        try {
            List<Map<String, String>> rows = parseFile(file);
            for (Map<String, String> row : rows) {
                int rowNumber = totalRecords + 2;
                totalRecords++;
                
                String roll = row.getOrDefault("rollNumber", "").trim();
                String rowDateStr = row.getOrDefault("date", "").trim();

                if (roll.isEmpty()) {
                    errors.add(new ValidationError(rowNumber, "rollNumber", "Roll number is required"));
                    continue;
                }

                // Date validation
                if (rowDateStr.isEmpty() && defaultDate == null) {
                    errors.add(new ValidationError(rowNumber, "date", "Date is required (either in file or via selector)"));
                    continue;
                }

                if (!rowDateStr.isEmpty()) {
                    try {
                        LocalDate.parse(rowDateStr);
                    } catch (Exception e) {
                        errors.add(new ValidationError(rowNumber, "date", "Invalid date format: " + rowDateStr + ". Use YYYY-MM-DD"));
                        continue;
                    }
                }

                // Check student exists
                Optional<User> userOpt = userRepository.findByUsername(roll.toLowerCase());
                if (userOpt.isEmpty()) {
                    errors.add(new ValidationError(rowNumber, "rollNumber", "Student not found: " + roll));
                    continue;
                }

                validRecords.add(new ValidRecordPreview(rowNumber, row));
                String dataJson = objectMapper.writeValueAsString(row);
                TempUploadData tempData = new TempUploadData(log.getId(), rowNumber, dataJson);
                tempUploadDataRepository.save(tempData);
            }
        } catch (Exception e) {
            errors.add(new ValidationError(0, "FILE", "Could not read file: " + e.getMessage()));
        }

        result.setTotalRecords(totalRecords);
        result.setValidRecords(validRecords.size());
        result.setInvalidRecords(errors.size());
        result.setValidData(validRecords);
        result.setErrors(errors);

        log.setTotalRecords(totalRecords);
        log.setValidRecords(validRecords.size());
        log.setInvalidRecords(errors.size());
        log.setStatus(UploadStatus.VALIDATED);
        log.setErrorSummary(serializeErrors(errors));
        bulkUploadLogRepository.save(log);

        return result;
    }

    /**
     * STEP 2: Confirm attendance upload
     */
    @Transactional
    public int confirmAttendanceUpload(Long uploadLogId, Long confirmedBy, Long mappingId, String dateStr) {
        BulkUploadLog log = bulkUploadLogRepository.findById(uploadLogId)
                .orElseThrow(() -> new RuntimeException("Upload log not found"));

        FacultySubjectMap map = facultySubjectMapRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Subject mapping not found"));

        LocalDate defaultDate = null;
        try {
            if (dateStr != null && !dateStr.isEmpty()) defaultDate = LocalDate.parse(dateStr);
        } catch (Exception e) {}

        List<TempUploadData> tempDataList = tempUploadDataRepository.findByUploadLogIdOrderByRowNum(uploadLogId);
        int count = 0;

        Map<LocalDate, AttendanceSession> sessionCache = new HashMap<>();

        try {
            for (TempUploadData tempData : tempDataList) {
                Map<String, String> data = objectMapper.readValue(tempData.getDataJson(), new TypeReference<Map<String, String>>() {});
                String roll = data.get("rollNumber").trim().toLowerCase();
                String statusStr = data.getOrDefault("status", "PRESENT").trim().toUpperCase();
                
                String rowDateStr = data.get("date");
                LocalDate date = (rowDateStr != null && !rowDateStr.isEmpty()) 
                    ? LocalDate.parse(rowDateStr.trim()) 
                    : defaultDate;

                if (date == null) continue;

                User user = userRepository.findByUsername(roll).orElse(null);
                if (user == null) continue;

                Student student = studentRepository.findByUser(user).orElse(null);
                if (student == null) continue;

                // Get or create session (cached)
                AttendanceSession session = sessionCache.computeIfAbsent(date, d -> getOrCreateSession(mappingId, map, d));

                // Create or update record
                AttendanceRecord record = attendanceRecordRepository.findBySessionAndStudent(session, student)
                        .orElse(new AttendanceRecord());
                
                record.setSession(session);
                record.setStudent(student);
                record.setTimestamp(date.atTime(9, 15)); // Default timestamp
                
                if (statusStr.startsWith("P") || statusStr.contains("PRESENT")) {
                    record.setStatus(AttendanceStatus.PRESENT);
                } else {
                    record.setStatus(AttendanceStatus.ABSENT);
                }
                record.setRemarks("Bulk Imported");
                
                attendanceRecordRepository.save(record);
                count++;
            }

            log.setStatus(UploadStatus.CONFIRMED);
            bulkUploadLogRepository.save(log);
            tempUploadDataRepository.deleteByUploadLogId(uploadLogId);
            return count;
        } catch (Exception e) {
            log.setStatus(UploadStatus.FAILED);
            bulkUploadLogRepository.save(log);
            throw new RuntimeException("Attendance import failed: " + e.getMessage());
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
            String headerLine = null;
            while ((headerLine = reader.readLine()) != null) {
                if (headerLine.isBlank()) {
                    continue;
                }
                if (headerLine.trim().startsWith("#")) {
                    continue;
                }
                break;
            }

            if (headerLine == null) return result;
            List<String> headers = parseCsvLine(headerLine);
            for (int i = 0; i < headers.size(); i++) headers.set(i, headers.get(i).trim());

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank() || line.trim().startsWith("#")) continue;
                List<String> values = parseCsvLine(line);
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    row.put(headers.get(i), i < values.size() ? values.get(i).trim() : "");
                }
                // Map CSV column names to the internal keys expected by validate methods
                normalizeKeys(row);
                result.add(row);
            }
        }
        return result;
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        values.add(current.toString());
        return values;
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
        // Common header variants (Excel exports often use spaces / different casing)
        remap(row, "firstName",       "First Name", "FIRST NAME", "firstname", "first_name", "givenName", "given_name", "first name");
        remap(row, "lastName",        "Last Name", "LAST NAME", "lastname", "last_name", "surname", "familyName", "family_name", "last name");
        remap(row, "fullName",        "Full Name", "FULL NAME", "name", "studentName", "facultyName", "full name");
        remap(row, "rollNumber",      "Roll No", "ROLL NO", "rollNo", "roll", "roll_no", "rollnumber");
        remap(row, "facultyId",       "Faculty ID", "FACULTY ID", "employeeId", "employeeID", "empId", "empID", "facultyid", "faculty id");
        remap(row, "departmentCode",  "Department", "DEPARTMENT", "dept", "deptCode", "dept_code", "department", "branch", "departmentrole", "DepartmentCode", "departmentcode", "departementCode", "departementcode");
        remap(row, "email",           "Email", "EMAIL", "emailId", "email_id", "mail");
        remap(row, "gender",          "Gender", "GENDER", "sex");
        remap(row, "admissionYear",   "Admission Year", "ADMISSION YEAR", "yearOfAdmission", "year_of_admission", "admission year");
        remap(row, "joiningDate",     "Joining Date", "JOINING DATE", "dateOfJoining", "date_of_joining", "joining date", "joiningDat");
        remap(row, "qualifications",  "Qualification", "Qualifications", "QUALIFICATIONS", "qualification", "qualificatic");
        remap(row, "designation",     "Designation", "DESIGNATION", "designation");
        remap(row, "employmentStatus","Employment Status", "EMPLOYMENT STATUS", "status", "employmentStatus", "employment status");
        remap(row, "role",            "Role", "ROLE");

        remap(row, "mobile",          "contactNumber", "phone", "mobileNumber", "contactnumber");
        remap(row, "semester",        "currentSemester", "currentSem", "sem", "current_sem");
        remap(row, "program",         "programType");

        // Normalize departmentCode values like "Computer Science & Engineering (CSE)" -> "CSE"
        if (row.containsKey("departmentCode")) {
            row.put("departmentCode", normalizeDepartmentCode(row.get("departmentCode")));
        }

        String fullName = row.get("fullName") != null ? row.get("fullName").trim() : "";
        String firstName = row.get("firstName") != null ? row.get("firstName").trim() : "";
        String lastName = row.get("lastName") != null ? row.get("lastName").trim() : "";

        // Build fullName if missing
        if (fullName.isEmpty() && (!firstName.isEmpty() || !lastName.isEmpty())) {
            row.put("fullName", (firstName + " " + lastName).trim());
            fullName = row.get("fullName");
        }

        // Split fullName if firstName missing
        if (!fullName.isEmpty() && firstName.isEmpty()) {
            String[] parts = fullName.split(" ", 2);
            row.put("firstName", parts[0]);
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

    private String normalizeDepartmentCode(String raw) {
        if (raw == null) return "";
        String v = raw.trim();
        if (v.isEmpty()) return "";
        // Extract code from parentheses: "X (CSE)" -> "CSE"
        int l = v.lastIndexOf('(');
        int r = v.lastIndexOf(')');
        if (l >= 0 && r > l + 1) {
            String inside = v.substring(l + 1, r).trim();
            if (!inside.isEmpty() && inside.length() <= 16) {
                return inside.toUpperCase();
            }
        }
        // If it's like "CSE - Computer Science", take left side
        if (v.contains("-")) {
            String left = v.split("-", 2)[0].trim();
            if (!left.isEmpty() && left.length() <= 16) return left.toUpperCase();
        }
        // Otherwise assume it's already a code
        return v.toUpperCase();
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
    
    private void validateStudentData(Map<String, String> data, int rowNumber, List<ValidationError> errors, CourseClass targetClass) {
        // Required fields validation
        String firstName = data.get("firstName") != null ? data.get("firstName").trim() : "";
        String lastName = data.get("lastName") != null ? data.get("lastName").trim() : "";
        String rollNumber = data.get("rollNumber") != null ? data.get("rollNumber").trim() : "";
        String email = data.get("email") != null ? data.get("email").trim() : "";
        String deptCode = data.get("departmentCode") != null ? data.get("departmentCode").trim() : "";

        // Check required fields
        if (firstName.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "firstName", "First name is required"));
        }
        if (lastName.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "lastName", "Last name is required"));
        }
        if (rollNumber.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "rollNumber", "Roll number is required"));
        }
        if (email.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "email", "Email is required"));
        }
        if (deptCode.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "departmentCode", "Department code is required"));
        }

        // Skip further validation if required fields are missing
        if (firstName.isEmpty() || lastName.isEmpty() || rollNumber.isEmpty() || email.isEmpty() || deptCode.isEmpty()) {
            return;
        }

        String username = rollNumber.toLowerCase();
        String mobile = data.get("mobile") != null ? data.get("mobile").trim() : "";
        String program = data.get("program") != null ? data.get("program").trim() : "";

        // Check duplicate roll number
        Optional<User> existingUser = userRepository.findByUsername(username);
        if (existingUser.isPresent()) {
            // If user exists, check if they are already in a class for the current academic year
            AcademicYear activeYear = academicYearRepository.findByActiveTrue().orElse(null);
            if (activeYear != null) {
                Optional<Student> studentOpt = studentRepository.findByUser(existingUser.get());
                if (studentOpt.isPresent()) {
                    Optional<StudentClassMap> existingMap = studentClassMapRepository.findByStudentAndAcademicYear(studentOpt.get(), activeYear);
                    if (existingMap.isPresent()) {
                        CourseClass currentClass = existingMap.get().getCourseClass();
                        if (targetClass == null || !currentClass.getId().equals(targetClass.getId())) {
                            errors.add(new ValidationError(rowNumber, "rollNumber", 
                                String.format("Student %s is already enrolled in class: %s for %s. A student can only be in one class at a time.", 
                                    rollNumber, currentClass.getName(), activeYear.getName())));
                        }
                    }
                }
            }
        }

        // Check duplicate email
        if (userRepository.existsByEmail(email)) {
            errors.add(new ValidationError(rowNumber, "email", "Email already exists: " + email));
        }

        // Validate email format
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            errors.add(new ValidationError(rowNumber, "email", "Invalid email format: " + email));
        }

        // Validate mobile format (optional field)
        if (!mobile.isEmpty() && !MOBILE_PATTERN.matcher(mobile).matches()) {
            errors.add(new ValidationError(rowNumber, "mobile", "Invalid mobile number (must be 10 digits): " + mobile));
        }

        // Validate department exists
        String normalizedDeptCode = normalizeDepartmentCode(deptCode);
        if (!departmentRepository.existsByCode(normalizedDeptCode)) {
            errors.add(new ValidationError(rowNumber, "departmentCode", "Department not found: " + deptCode));
        }

        // Validate program type (optional field)
        if (!program.isEmpty() && !program.equalsIgnoreCase("UG") && !program.equalsIgnoreCase("PG")) {
            errors.add(new ValidationError(rowNumber, "program", "Program must be UG or PG: " + program));
        }

        // Validate gender (optional field)
        String gender = data.get("gender") != null ? data.get("gender").trim() : "";
        if (!gender.isEmpty() && !gender.equalsIgnoreCase("MALE") && !gender.equalsIgnoreCase("FEMALE")) {
            errors.add(new ValidationError(rowNumber, "gender", "Gender must be MALE or FEMALE: " + gender));
        }

        // Validate status (optional field)
        String status = data.get("status") != null ? data.get("status").trim() : "";
        if (!status.isEmpty() && !status.equalsIgnoreCase("ACTIVE") && !status.equalsIgnoreCase("INACTIVE")) {
            errors.add(new ValidationError(rowNumber, "status", "Status must be ACTIVE or INACTIVE: " + status));
        }

        // Validate against target class if provided
        if (targetClass != null) {
            String excelDept = normalizedDeptCode;
            String excelSem = data.getOrDefault("semester", "").trim();
            String excelSec = data.getOrDefault("section", "").trim();
            
            // Check Department
            if (!targetClass.getDepartment().equalsIgnoreCase(excelDept)) {
                errors.add(new ValidationError(rowNumber, "departmentCode", 
                    String.format("Student department (%s) does not match the selected class department (%s)", 
                        excelDept, targetClass.getDepartment())));
            }
            
            // Check Semester/Year
            if (!excelSem.isEmpty()) {
                try {
                    // Extract numeric part (e.g., "4 A" -> 4)
                    String numericSem = excelSem.replaceAll("[^0-9]", "");
                    if (numericSem.isEmpty()) throw new NumberFormatException("No digits found");
                    
                    int sem = Integer.parseInt(numericSem);
                    int yearFromSem = (sem + 1) / 2;
                    
                    if (targetClass.getYearLevel() != sem && targetClass.getYearLevel() != yearFromSem) {
                         // Fallback check: does name contain the semester number?
                         if (!targetClass.getName().contains(numericSem)) {
                             errors.add(new ValidationError(rowNumber, "semester", 
                                 String.format("Student semester (%s) does not match selected class year level (%d). (Year %d normally covers semesters %d and %d)", 
                                     excelSem, targetClass.getYearLevel(), targetClass.getYearLevel(), (targetClass.getYearLevel()*2)-1, targetClass.getYearLevel()*2)));
                         }
                    }
                } catch (NumberFormatException e) {
                    errors.add(new ValidationError(rowNumber, "semester", "Invalid semester number: " + excelSem));
                }
            }
            
            // Check Section (if target class has a section in its name e.g. "3A")
            if (!excelSec.isEmpty() && !targetClass.getName().toUpperCase().contains(excelSec.toUpperCase())) {
                errors.add(new ValidationError(rowNumber, "section", 
                    String.format("Student section (%s) does not match selected class (%s)", 
                        excelSec, targetClass.getName())));
            }
        }
    }

    private void validateFacultyData(Map<String, String> data, int rowNumber, List<ValidationError> errors) {
        // Required fields validation
        String firstName = data.get("firstName") != null ? data.get("firstName").trim() : "";
        String lastName = data.get("lastName") != null ? data.get("lastName").trim() : "";
        String facultyId = data.get("facultyId") != null ? data.get("facultyId").trim() : "";
        String email = data.get("email") != null ? data.get("email").trim() : "";
        String deptCode = data.get("departmentCode") != null ? data.get("departmentCode").trim() : "";

        // Check required fields
        if (firstName.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "firstName", "First name is required"));
        }
        if (lastName.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "lastName", "Last name is required"));
        }
        if (facultyId.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "facultyId", "Faculty ID is required"));
        }
        if (email.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "email", "Email is required"));
        }
        if (deptCode.isEmpty()) {
            errors.add(new ValidationError(rowNumber, "departmentCode", "Department code is required"));
        }

        // Skip further validation if required fields are missing
        if (firstName.isEmpty() || lastName.isEmpty() || facultyId.isEmpty() || email.isEmpty() || deptCode.isEmpty()) {
            return;
        }

        String username = facultyId.toLowerCase();
        String mobile = data.get("mobile") != null ? data.get("mobile").trim() : "";
        String role = data.get("role") != null ? data.get("role").trim() : "";

        // Check duplicate faculty ID
        if (userRepository.existsByUsername(username)) {
            errors.add(new ValidationError(rowNumber, "facultyId", "Faculty ID already exists: " + facultyId));
        }

        // Check duplicate email
        if (userRepository.existsByEmail(email)) {
            errors.add(new ValidationError(rowNumber, "email", "Email already exists: " + email));
        }

        // Validate email format
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            errors.add(new ValidationError(rowNumber, "email", "Invalid email format: " + email));
        }

        // Validate mobile format (optional field)
        if (!mobile.isEmpty() && !MOBILE_PATTERN.matcher(mobile).matches()) {
            errors.add(new ValidationError(rowNumber, "mobile", "Invalid mobile number (must be 10 digits): " + mobile));
        }

        // Validate department exists
        String normalizedDeptCode = normalizeDepartmentCode(deptCode);
        if (!departmentRepository.existsByCode(normalizedDeptCode)) {
            errors.add(new ValidationError(rowNumber, "departmentCode", "Department not found: " + deptCode));
        }

        // Validate role (optional field)
        if (!role.isEmpty()) {
            try {
                Role.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                errors.add(new ValidationError(rowNumber, "role", "Invalid role: " + role + ". Must be FACULTY, HOD, or PRINCIPAL"));
            }
        }

        // Validate gender (optional field)
        String gender = data.get("gender") != null ? data.get("gender").trim() : "";
        if (!gender.isEmpty() && !gender.equalsIgnoreCase("MALE") && !gender.equalsIgnoreCase("FEMALE")) {
            errors.add(new ValidationError(rowNumber, "gender", "Gender must be MALE or FEMALE: " + gender));
        }

        // Validate employment status (optional field)
        String employmentStatus = data.get("employmentStatus") != null ? data.get("employmentStatus").trim() : "";
        if (!employmentStatus.isEmpty() && !employmentStatus.equalsIgnoreCase("ACTIVE") && !employmentStatus.equalsIgnoreCase("INACTIVE")) {
            errors.add(new ValidationError(rowNumber, "employmentStatus", "Employment status must be ACTIVE or INACTIVE: " + employmentStatus));
        }
    }

    // ==================== HELPER METHODS ====================

    private User createUserFromStudentData(Map<String, String> data) {
        String fullName = data.get("fullName") != null ? data.get("fullName").trim() : "";
        String firstName;
        String lastName;
        if (!fullName.isEmpty()) {
            String[] nameParts = fullName.split(" ", 2);
            firstName = nameParts[0];
            lastName = nameParts.length > 1 ? nameParts[1] : "";
        } else {
            firstName = data.getOrDefault("firstName", "").trim();
            lastName = data.getOrDefault("lastName", "").trim();
            fullName = (firstName + " " + lastName).trim();
        }

        User user = new User();
        String rollNumber = data.getOrDefault("rollNumber", "").trim();
        user.setUsername(rollNumber.toLowerCase());
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

        // Default password = roll number (same as single-add flow)
        user.setPassword(passwordEncoder.encode(rollNumber));

        return user;
    }

    private Student createStudentFromData(Map<String, String> data, User user) {
        Student student = new Student();
        student.setUser(user);
        String rollNumber = data.getOrDefault("rollNumber", "").trim();
        student.setRollNumber(rollNumber);
        String deptCode = data.getOrDefault("departmentCode", "").trim().toUpperCase();
        student.setDepartment(deptCode); // Legacy field
        if (!deptCode.isEmpty()) {
            departmentRepository.findByCode(deptCode).ifPresent(student::setDepartmentEntity);
        }

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
            case FORMULA:
                switch (cell.getCachedFormulaResultType()) {
                    case STRING:
                        return cell.getStringCellValue().trim();
                    case NUMERIC:
                        return String.valueOf((long) cell.getNumericCellValue());
                    case BOOLEAN:
                        return String.valueOf(cell.getBooleanCellValue());
                    default:
                        return "";
                }
            default:
                return "";
        }
    }

    private User createUserFromFacultyData(Map<String, String> data) {
        String fullName = data.get("fullName") != null ? data.get("fullName").trim() : "";
        String firstName;
        String lastName;
        if (!fullName.isEmpty()) {
            String[] nameParts = fullName.split(" ", 2);
            firstName = nameParts[0];
            lastName = nameParts.length > 1 ? nameParts[1] : "";
        } else {
            firstName = data.getOrDefault("firstName", "").trim();
            lastName = data.getOrDefault("lastName", "").trim();
            fullName = (firstName + " " + lastName).trim();
        }

        User user = new User();
        String facultyId = data.getOrDefault("facultyId", "").trim();
        user.setUsername(facultyId.toLowerCase());
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

        // Default password = facultyId (same as single-add flow)
        user.setPassword(passwordEncoder.encode(facultyId));

        return user;
    }

    private Faculty createFacultyFromData(Map<String, String> data, User user) {
        Faculty faculty = new Faculty();
        faculty.setUser(user);
        faculty.setFacultyId(data.getOrDefault("facultyId", "").trim());
        String deptCode = data.getOrDefault("departmentCode", "").trim().toUpperCase();
        faculty.setDepartment(deptCode); // Legacy field
        if (!deptCode.isEmpty()) {
            departmentRepository.findByCode(deptCode).ifPresent(faculty::setDepartmentEntity);
        }
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

    private String serializeErrors(List<ValidationError> errors) {
        if (errors == null || errors.isEmpty()) {
            return null;
        }
        try {
            // If too many errors, only log the first 200 to avoid "Data too long" issues
            // and extremely large database entries
            if (errors.size() > 200) {
                List<ValidationError> subList = errors.subList(0, 200);
                String json = objectMapper.writeValueAsString(subList);
                return json.substring(0, json.length() - 1) + 
                    ", {\"rowNumber\":0,\"field\":\"TRUNCATED\",\"errorMessage\":\"... and " + 
                    (errors.size() - 200) + " more errors omitted for logging brevity\"}]";
            }
            return objectMapper.writeValueAsString(errors);
        } catch (JsonProcessingException e) {
            return "Error serializing validation errors: " + e.getMessage();
        }
    }

    private AttendanceSession getOrCreateSession(Long mappingId, FacultySubjectMap map, LocalDate date) {
        return attendanceSessionRepository.findByFacultySubjectMap_Id(mappingId).stream()
                .filter(s -> s.getStartTime().toLocalDate().equals(date))
                .findFirst()
                .orElseGet(() -> {
                    AttendanceSession s = new AttendanceSession();
                    s.setFacultySubjectMap(map);
                    s.setStartTime(date.atTime(9, 0)); // Default 9 AM
                    s.setEndTime(date.atTime(10, 0));  // Default 10 AM
                    s.setActive(false); // Past session is not active
                    s.setRemarks("Bulk Imported Session");
                    return attendanceSessionRepository.save(s);
                });
    }

    // ==================== MONTHLY ATTENDANCE UPLOAD ====================

    /**
     * Validates a monthly attendance Excel upload.
     * Expected format:
     *   Row 1 (header): Roll No | 2026-05-01 | 2026-05-02 | ... | 2026-05-31
     *   Row 2+:         24001   | P          | A          | ... | P
     *
     * Each cell value should be P (present) or A (absent). Empty cells are skipped.
     */
    public Map<String, Object> validateMonthlyAttendanceUpload(MultipartFile file, Long uploadedBy, Long mappingId) throws IOException {
        BulkUploadLog log = new BulkUploadLog(UploadType.ATTENDANCE, uploadedBy, file.getOriginalFilename());
        log = bulkUploadLogRepository.save(log);

        List<Map<String, String>> flatRecords = new ArrayList<>();
        List<ValidationError> errors = new ArrayList<>();
        List<String> dateColumns = new ArrayList<>();
        int totalStudents = 0;

        FacultySubjectMap map = facultySubjectMapRepository.findById(mappingId).orElse(null);
        if (map == null) {
            errors.add(new ValidationError(0, "mappingId", "Subject mapping not found"));
            return buildMonthlyResult(log, 0, 0, flatRecords, errors, dateColumns);
        }

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIter = sheet.iterator();
            if (!rowIter.hasNext()) {
                errors.add(new ValidationError(0, "FILE", "Empty spreadsheet"));
                return buildMonthlyResult(log, 0, 0, flatRecords, errors, dateColumns);
            }

            // Parse header row to extract date columns
            Row headerRow = rowIter.next();
            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) headers.add(getCellValue(cell).trim());

            // First column should be roll number; remaining should be dates
            for (int i = 1; i < headers.size(); i++) {
                String h = headers.get(i);
                LocalDate parsed = tryParseDate(h);
                if (parsed != null) {
                    dateColumns.add(parsed.toString());
                } else {
                    dateColumns.add(null); // Will skip this column
                    errors.add(new ValidationError(1, h, "Column '" + h + "' is not a valid date (use YYYY-MM-DD or DD/MM/YYYY)"));
                }
            }

            // Parse student rows
            while (rowIter.hasNext()) {
                Row currentRow = rowIter.next();
                int rowNum = currentRow.getRowNum() + 1;
                String roll = getCellValue(currentRow.getCell(0)).trim();
                if (roll.isEmpty()) continue;
                totalStudents++;

                // Validate student exists
                Optional<User> userOpt = userRepository.findByUsername(roll.toLowerCase());
                if (userOpt.isEmpty()) {
                    errors.add(new ValidationError(rowNum, "rollNumber", "Student not found: " + roll));
                    continue;
                }

                // Process each date column
                for (int i = 1; i < headers.size(); i++) {
                    if (i - 1 >= dateColumns.size() || dateColumns.get(i - 1) == null) continue;

                    String cellVal = getCellValue(currentRow.getCell(i)).trim().toUpperCase();
                    if (cellVal.isEmpty()) continue; // Skip empty cells

                    String status;
                    if (cellVal.startsWith("P") || cellVal.equals("1")) {
                        status = "PRESENT";
                    } else if (cellVal.startsWith("A") || cellVal.equals("0")) {
                        status = "ABSENT";
                    } else {
                        errors.add(new ValidationError(rowNum, dateColumns.get(i - 1), "Invalid value '" + cellVal + "' for " + roll + ". Use P or A."));
                        continue;
                    }

                    Map<String, String> record = new LinkedHashMap<>();
                    record.put("rollNumber", roll);
                    record.put("date", dateColumns.get(i - 1));
                    record.put("status", status);
                    flatRecords.add(record);

                    // Store in temp data
                    String dataJson = objectMapper.writeValueAsString(record);
                    TempUploadData tempData = new TempUploadData(log.getId(), flatRecords.size(), dataJson);
                    tempUploadDataRepository.save(tempData);
                }
            }
        }

        return buildMonthlyResult(log, totalStudents, flatRecords.size(), flatRecords, errors, dateColumns.stream().filter(Objects::nonNull).collect(java.util.stream.Collectors.toList()));
    }

    private Map<String, Object> buildMonthlyResult(BulkUploadLog log, int totalStudents, int totalRecords,
                                                   List<Map<String, String>> records, List<ValidationError> errors, List<String> dates) {
        log.setTotalRecords(totalRecords);
        log.setValidRecords(records.size());
        log.setInvalidRecords(errors.size());
        log.setStatus(errors.isEmpty() && records.size() > 0 ? UploadStatus.VALIDATED : UploadStatus.FAILED);
        log.setErrorSummary(serializeErrors(errors));
        bulkUploadLogRepository.save(log);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("uploadLogId", log.getId());
        result.put("fileName", log.getFileName());
        result.put("totalStudents", totalStudents);
        result.put("totalRecords", totalRecords);
        result.put("validRecords", records.size());
        result.put("invalidRecords", errors.size());
        result.put("dates", dates);
        result.put("errors", errors);

        // Summary: count present/absent
        long presentCount = records.stream().filter(r -> "PRESENT".equals(r.get("status"))).count();
        long absentCount = records.stream().filter(r -> "ABSENT".equals(r.get("status"))).count();
        result.put("presentCount", presentCount);
        result.put("absentCount", absentCount);

        return result;
    }

    /**
     * Confirm monthly attendance upload — creates sessions and records.
     */
    @Transactional
    public int confirmMonthlyAttendanceUpload(Long uploadLogId, Long confirmedBy, Long mappingId) {
        BulkUploadLog log = bulkUploadLogRepository.findById(uploadLogId)
                .orElseThrow(() -> new RuntimeException("Upload log not found"));

        FacultySubjectMap map = facultySubjectMapRepository.findById(mappingId)
                .orElseThrow(() -> new RuntimeException("Subject mapping not found"));

        List<TempUploadData> tempDataList = tempUploadDataRepository.findByUploadLogIdOrderByRowNum(uploadLogId);
        int count = 0;

        Map<LocalDate, AttendanceSession> sessionCache = new HashMap<>();

        try {
            for (TempUploadData tempData : tempDataList) {
                Map<String, String> data = objectMapper.readValue(tempData.getDataJson(), new TypeReference<Map<String, String>>() {});
                String roll = data.get("rollNumber").trim().toLowerCase();
                String statusStr = data.getOrDefault("status", "PRESENT").trim();
                LocalDate date = LocalDate.parse(data.get("date").trim());

                User user = userRepository.findByUsername(roll).orElse(null);
                if (user == null) continue;

                Student student = studentRepository.findByUser(user).orElse(null);
                if (student == null) continue;

                AttendanceSession session = sessionCache.computeIfAbsent(date, d -> getOrCreateSession(mappingId, map, d));

                AttendanceRecord record = attendanceRecordRepository.findBySessionAndStudent(session, student)
                        .orElse(new AttendanceRecord());

                record.setSession(session);
                record.setStudent(student);
                record.setTimestamp(date.atTime(9, 15));

                if ("PRESENT".equals(statusStr)) {
                    record.setStatus(AttendanceStatus.PRESENT);
                } else {
                    record.setStatus(AttendanceStatus.ABSENT);
                }
                record.setRemarks("Monthly Bulk Import");

                attendanceRecordRepository.save(record);
                count++;
            }

            log.setStatus(UploadStatus.CONFIRMED);
            bulkUploadLogRepository.save(log);
            tempUploadDataRepository.deleteByUploadLogId(uploadLogId);

            auditService.logAction(confirmedBy, "BulkUpload", uploadLogId, "MONTHLY_ATTENDANCE_CONFIRMED",
                    null, count + " attendance records imported", null);

            return count;
        } catch (Exception e) {
            log.setStatus(UploadStatus.FAILED);
            bulkUploadLogRepository.save(log);
            throw new RuntimeException("Monthly attendance import failed: " + e.getMessage());
        }
    }

    /**
     * Tries to parse a date string in common formats.
     */
    private LocalDate tryParseDate(String s) {
        if (s == null || s.isBlank()) return null;
        s = s.trim();
        // Try YYYY-MM-DD
        try { return LocalDate.parse(s); } catch (Exception ignored) {}
        // Try DD/MM/YYYY
        try {
            String[] parts = s.split("[/\\-.]");
            if (parts.length == 3) {
                int a = Integer.parseInt(parts[0]);
                int b = Integer.parseInt(parts[1]);
                int c = Integer.parseInt(parts[2]);
                if (c > 1000) return LocalDate.of(c, b, a); // DD/MM/YYYY
                if (a > 1000) return LocalDate.of(a, b, c); // YYYY/MM/DD
            }
        } catch (Exception ignored) {}
        // Try Excel serial date number
        try {
            double serial = Double.parseDouble(s);
            if (serial > 40000 && serial < 60000) {
                java.util.Date d = org.apache.poi.ss.usermodel.DateUtil.getJavaDate(serial);
                return d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            }
        } catch (Exception ignored) {}
        return null;
    }
}

