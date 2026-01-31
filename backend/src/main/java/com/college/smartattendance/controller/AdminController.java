package com.college.smartattendance.controller;

import com.college.smartattendance.dto.ClassDto;
import com.college.smartattendance.dto.StatsDto;
import com.college.smartattendance.entity.CourseClass;
import com.college.smartattendance.service.AdminService;
import com.college.smartattendance.service.ExcelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private ExcelService excelService;

    @Autowired
    private AdminService adminService;

    @PostMapping("/upload/students")
    public ResponseEntity<?> uploadStudents(@RequestParam("file") MultipartFile file) {
        try {
            int count = excelService.saveStudents(file);
            return ResponseEntity.ok(Map.of(
                    "message", "Students uploaded successfully",
                    "count", count));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Failed to upload students: " + e.getMessage()));
        }
    }

    @PostMapping("/upload/faculty")
    public ResponseEntity<?> uploadFaculty(@RequestParam("file") MultipartFile file) {
        try {
            int count = excelService.saveFaculty(file);
            return ResponseEntity.ok(Map.of(
                    "message", "Faculty uploaded successfully",
                    "count", count));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Failed to upload faculty: " + e.getMessage()));
        }
    }

    @PostMapping("/classes")
    public ResponseEntity<?> createClass(@RequestBody ClassDto classDto) {
        try {
            CourseClass courseClass = adminService.createClass(classDto);
            return ResponseEntity.ok(Map.of(
                    "message", "Class created successfully",
                    "class", courseClass));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Failed to create class: " + e.getMessage()));
        }
    }

    @GetMapping("/classes")
    public ResponseEntity<List<CourseClass>> getAllClasses() {
        return ResponseEntity.ok(adminService.getAllClasses());
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<?> deleteClass(@PathVariable Long id) {
        try {
            adminService.deleteClass(id);
            return ResponseEntity.ok(Map.of("message", "Class deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Failed to delete class: " + e.getMessage()));
        }
    }
}
