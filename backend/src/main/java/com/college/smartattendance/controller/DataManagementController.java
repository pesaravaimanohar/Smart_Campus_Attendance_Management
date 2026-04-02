package com.college.smartattendance.controller;

import com.college.smartattendance.dto.DepartmentDto;
import com.college.smartattendance.dto.FacultyDto;
import com.college.smartattendance.dto.FacultySubjectAssignmentDto;
import com.college.smartattendance.dto.StudentDto;
import com.college.smartattendance.dto.SubjectDto;
import com.college.smartattendance.entity.AcademicYear;
import com.college.smartattendance.entity.CourseClass;
import com.college.smartattendance.entity.Department;
import com.college.smartattendance.service.DataManagementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/data")
public class DataManagementController {

    @Autowired
    private DataManagementService dataManagementService;

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDto>> getDepartments() {
        return ResponseEntity.ok(dataManagementService.getAllDepartments());
    }

    @PostMapping("/departments")
    public ResponseEntity<DepartmentDto> createDepartment(@RequestBody Map<String, String> body) {
        DepartmentDto department = dataManagementService.createDepartment(body.get("code"), body.get("name"));
        return ResponseEntity.ok(department);
    }

    @PostMapping("/departments/seed")
    public ResponseEntity<List<DepartmentDto>> seedDepartments() {
        return ResponseEntity.ok(dataManagementService.ensureJntuaDepartments());
    }

    @GetMapping("/academic-years")
    public ResponseEntity<List<AcademicYear>> getAcademicYears() {
        return ResponseEntity.ok(dataManagementService.getAllAcademicYears());
    }

    @PostMapping("/academic-years")
    public ResponseEntity<AcademicYear> createAcademicYear(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        boolean active = Boolean.TRUE.equals(body.get("active"));
        return ResponseEntity.ok(dataManagementService.createAcademicYear(name, active));
    }

    @GetMapping("/students")
    public ResponseEntity<List<StudentDto>> getAllStudents() {
        return ResponseEntity.ok(dataManagementService.getAllStudents());
    }

    @PostMapping("/students")
    public ResponseEntity<StudentDto> createStudent(@Valid @RequestBody StudentDto dto) {
        return ResponseEntity.ok(dataManagementService.createStudent(dto));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<StudentDto> updateStudent(@PathVariable Long id, @Valid @RequestBody StudentDto dto) {
        return ResponseEntity.ok(dataManagementService.updateStudent(id, dto));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<Map<String, String>> deleteStudent(@PathVariable Long id) {
        dataManagementService.deleteStudent(id);
        return ResponseEntity.ok(Map.of("message", "Student deleted successfully"));
    }

    @GetMapping("/faculty")
    public ResponseEntity<List<FacultyDto>> getAllFaculty() {
        return ResponseEntity.ok(dataManagementService.getAllFaculty());
    }

    @PostMapping("/faculty")
    public ResponseEntity<FacultyDto> createFaculty(@Valid @RequestBody FacultyDto dto) {
        return ResponseEntity.ok(dataManagementService.createFaculty(dto));
    }

    @PutMapping("/faculty/{id}")
    public ResponseEntity<FacultyDto> updateFaculty(@PathVariable Long id, @Valid @RequestBody FacultyDto dto) {
        return ResponseEntity.ok(dataManagementService.updateFaculty(id, dto));
    }

    @DeleteMapping("/faculty/{id}")
    public ResponseEntity<Map<String, String>> deleteFaculty(@PathVariable Long id) {
        dataManagementService.deleteFaculty(id);
        return ResponseEntity.ok(Map.of("message", "Faculty deleted successfully"));
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectDto>> getAllSubjects() {
        return ResponseEntity.ok(dataManagementService.getAllSubjects());
    }

    @PostMapping("/subjects")
    public ResponseEntity<SubjectDto> createSubject(@Valid @RequestBody SubjectDto dto) {
        return ResponseEntity.ok(dataManagementService.createSubject(dto));
    }

    @PutMapping("/subjects/{id}")
    public ResponseEntity<SubjectDto> updateSubject(@PathVariable Long id, @Valid @RequestBody SubjectDto dto) {
        return ResponseEntity.ok(dataManagementService.updateSubject(id, dto));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<Map<String, String>> deleteSubject(@PathVariable Long id) {
        dataManagementService.deleteSubject(id);
        return ResponseEntity.ok(Map.of("message", "Subject deleted successfully"));
    }

    @GetMapping("/assignments")
    public ResponseEntity<List<FacultySubjectAssignmentDto>> getAllAssignments() {
        return ResponseEntity.ok(dataManagementService.getAllAssignments());
    }

    @PostMapping("/assignments")
    public ResponseEntity<FacultySubjectAssignmentDto> createAssignment(
            @Valid @RequestBody FacultySubjectAssignmentDto dto) {
        return ResponseEntity.ok(dataManagementService.createAssignment(dto));
    }

    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<Map<String, String>> deleteAssignment(@PathVariable Long id) {
        dataManagementService.deleteAssignment(id);
        return ResponseEntity.ok(Map.of("message", "Assignment deleted successfully"));
    }

    @GetMapping("/classes")
    public ResponseEntity<List<CourseClass>> getClasses() {
        return ResponseEntity.ok(dataManagementService.getAllClasses());
    }
}
