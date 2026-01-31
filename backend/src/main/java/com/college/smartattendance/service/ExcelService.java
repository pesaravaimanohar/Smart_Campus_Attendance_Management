package com.college.smartattendance.service;

import com.college.smartattendance.entity.Faculty;
import com.college.smartattendance.entity.Role;
import com.college.smartattendance.entity.Student;
import com.college.smartattendance.entity.User;
import com.college.smartattendance.repository.FacultyRepository;
import com.college.smartattendance.repository.StudentRepository;
import com.college.smartattendance.repository.UserRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Iterator;

@Service
public class ExcelService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserService userService;

    public int saveStudents(MultipartFile file) throws IOException {
        int count = 0;
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            // Skip header
            if (rows.hasNext())
                rows.next();

            while (rows.hasNext()) {
                Row currentRow = rows.next();

                // Column assumption:
                // 0: Roll No (Username)
                // 1: Full Name
                // 2: DOB
                // 3: Department
                // 4: Admission Year
                // 5: Gender
                // 6: Mobile Number
                // 7: Email

                if (currentRow.getCell(0) == null)
                    continue;

                String rollNumber = getCellValue(currentRow.getCell(0));
                String fullName = getCellValue(currentRow.getCell(1));

                // Parse Name
                String firstName = fullName;
                String lastName = "";
                if (fullName.contains(" ")) {
                    String[] parts = fullName.split(" ", 2);
                    firstName = parts[0];
                    lastName = parts[1];
                }

                String dobStr = getCellValue(currentRow.getCell(2));
                String department = getCellValue(currentRow.getCell(3));
                String admissionYearStr = getCellValue(currentRow.getCell(4));
                String gender = getCellValue(currentRow.getCell(5));
                String mobile = getCellValue(currentRow.getCell(6));
                String email = getCellValue(currentRow.getCell(7));

                if (userRepository.existsByUsername(rollNumber))
                    continue;

                User user = new User();
                user.setUsername(rollNumber);
                user.setFirstName(firstName);
                user.setLastName(lastName);
                user.setEmail(email);
                user.setContactNumber(mobile);
                user.setGender(gender);
                user.setRole(Role.STUDENT);
                user.setFirstLogin(true);

                // Parse DOB
                LocalDate dob = null;
                try {
                    dob = LocalDate.parse(dobStr);
                } catch (Exception e) {
                    try {
                        dob = currentRow.getCell(2).getDateCellValue().toInstant().atZone(ZoneId.systemDefault())
                                .toLocalDate();
                    } catch (Exception ex) {
                        dob = LocalDate.of(2000, 1, 1); // Fallback
                    }
                }
                user.setDob(dob);

                // Default Password = DOB formatted or generic if fail?
                // Using UserService logic
                String rawPassword = userService.generateDefaultPassword(user);
                user.setPassword(passwordEncoder.encode(rawPassword));

                user = userRepository.save(user);

                Student student = new Student();
                student.setUser(user);
                student.setDepartment(department);
                try {
                    student.setAdmissionYear((int) Double.parseDouble(admissionYearStr));
                } catch (Exception e) {
                    student.setAdmissionYear(LocalDate.now().getYear());
                }

                studentRepository.save(student);
                count++;
            }
        }
        return count;
    }

    public int saveFaculty(MultipartFile file) throws IOException {
        int count = 0;
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            // Skip header
            if (rows.hasNext())
                rows.next();

            while (rows.hasNext()) {
                Row currentRow = rows.next();

                // Column assumption:
                // 0: Employee ID (Username)
                // 1: Full Name
                // 2: DOB
                // 3: Department
                // 4: Designation
                // 5: Role (FACULTY/HOD/PRINCIPAL)
                // 6: Gender
                // 7: Mobile Number
                // 8: Email

                if (currentRow.getCell(0) == null)
                    continue;

                String employeeId = getCellValue(currentRow.getCell(0));
                String fullName = getCellValue(currentRow.getCell(1));

                // Parse Name
                String firstName = fullName;
                String lastName = "";
                if (fullName.contains(" ")) {
                    String[] parts = fullName.split(" ", 2);
                    firstName = parts[0];
                    lastName = parts[1];
                }

                String dobStr = getCellValue(currentRow.getCell(2));
                String department = getCellValue(currentRow.getCell(3));
                String designation = getCellValue(currentRow.getCell(4));
                String roleStr = getCellValue(currentRow.getCell(5)).toUpperCase();
                String gender = getCellValue(currentRow.getCell(6));
                String mobile = getCellValue(currentRow.getCell(7));
                String email = getCellValue(currentRow.getCell(8));

                if (userRepository.existsByUsername(employeeId))
                    continue;

                // Determine Role
                Role role = Role.FACULTY;
                try {
                    role = Role.valueOf(roleStr);
                } catch (Exception e) {
                    // Default to FACULTY if invalid
                }

                User user = new User();
                user.setUsername(employeeId);
                user.setFirstName(firstName);
                user.setLastName(lastName);
                user.setEmail(email);
                user.setContactNumber(mobile);
                user.setGender(gender);
                user.setRole(role);
                user.setFirstLogin(true);

                // Parse DOB
                LocalDate dob = null;
                try {
                    dob = LocalDate.parse(dobStr);
                } catch (Exception e) {
                    try {
                        dob = currentRow.getCell(2).getDateCellValue().toInstant().atZone(ZoneId.systemDefault())
                                .toLocalDate();
                    } catch (Exception ex) {
                        dob = LocalDate.of(1980, 1, 1); // Fallback
                    }
                }
                user.setDob(dob);

                // Default Password
                String rawPassword = userService.generateDefaultPassword(user);
                user.setPassword(passwordEncoder.encode(rawPassword));

                user = userRepository.save(user);

                Faculty faculty = new Faculty();
                faculty.setUser(user);
                faculty.setDepartment(department);
                faculty.setDesignation(designation);

                facultyRepository.save(faculty);
                count++;
            }
        }
        return count;
    }

    private String getCellValue(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                return String.valueOf((long) cell.getNumericCellValue());
            default:
                return "";
        }
    }
}
