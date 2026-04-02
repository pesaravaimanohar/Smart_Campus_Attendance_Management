package com.college.smartattendance.dto;

import com.college.smartattendance.entity.ProgramType;
import com.college.smartattendance.entity.StudentStatus;
import java.time.LocalDate;

public class StudentDto {
    private Long id;
    private String rollNumber;
    private String studentId;
    private String firstName;
    private String lastName;
    private String email;
    private String contactNumber;
    private String gender;
    private LocalDate dob;
    private String departmentCode;
    private String departmentName;
    private ProgramType program;
    private Integer currentSemester;
    private String section;
    private StudentStatus status;
    private Integer admissionYear;

    public StudentDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    // alias used by service layer
    public String getMobile() { return contactNumber; }
    public void setMobile(String mobile) { this.contactNumber = mobile; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public String getDepartmentCode() { return departmentCode; }
    public void setDepartmentCode(String departmentCode) { this.departmentCode = departmentCode; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public ProgramType getProgram() { return program; }
    public void setProgram(ProgramType program) { this.program = program; }

    public Integer getCurrentSemester() { return currentSemester; }
    public void setCurrentSemester(Integer currentSemester) { this.currentSemester = currentSemester; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public StudentStatus getStatus() { return status; }
    public void setStatus(StudentStatus status) { this.status = status; }

    public Integer getAdmissionYear() { return admissionYear; }
    public void setAdmissionYear(Integer admissionYear) { this.admissionYear = admissionYear; }
}
