package com.college.smartattendance.controller;

import com.college.smartattendance.dto.ClassCurriculumDto;
import com.college.smartattendance.dto.ClassDto;
import com.college.smartattendance.dto.DepartmentDto;
import com.college.smartattendance.dto.FacultyDto;
import com.college.smartattendance.dto.FacultySubjectAssignmentDto;
import com.college.smartattendance.dto.StudentDto;
import com.college.smartattendance.dto.SubjectDto;
import com.college.smartattendance.entity.AcademicYear;
import com.college.smartattendance.entity.Department;
import com.college.smartattendance.service.ClassCurriculumService;
import com.college.smartattendance.service.DataManagementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/data")
public class DataManagementController {

    @Autowired
    private DataManagementService dataManagementService;

    @Autowired
    private ClassCurriculumService classCurriculumService;

    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDto>> getDepartments(@RequestParam(required = false) String programType) {
        if (programType != null && !programType.isBlank()) {
            return ResponseEntity.ok(dataManagementService.getDepartmentsByProgramType(programType));
        }
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

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<Map<String, String>> deleteDepartment(@PathVariable Long id) {
        dataManagementService.deleteDepartment(id);
        return ResponseEntity.ok(Map.of("message", "Department deleted successfully"));
    }

    @PostMapping("/departments/cleanup")
    public ResponseEntity<Map<String, String>> cleanupDepartments() {
        dataManagementService.cleanupUnwantedDepartments();
        return ResponseEntity.ok(Map.of("message", "Unwanted departments cleaned up"));
    }

    @PutMapping("/departments/{code}/hod")
    public ResponseEntity<DepartmentDto> assignHod(@PathVariable String code, @RequestBody Map<String, Long> body) {
        Long facultyId = body.get("facultyId");
        if (facultyId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(dataManagementService.assignHod(code, facultyId));
    }

    @PutMapping("/principal")
    public ResponseEntity<FacultyDto> assignPrincipal(@RequestBody Map<String, Long> body) {
        Long facultyId = body.get("facultyId");
        if (facultyId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(dataManagementService.assignPrincipal(facultyId));
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
    public ResponseEntity<List<ClassDto>> getClasses() {
        return ResponseEntity.ok(dataManagementService.getAllClasses());
    }

    @PostMapping("/classes")
    public ResponseEntity<ClassDto> createClass(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(dataManagementService.createClass(body));
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<Map<String, String>> deleteClass(@PathVariable Long id) {
        dataManagementService.deleteClass(id);
        return ResponseEntity.ok(Map.of("message", "Class deleted successfully"));
    }

    @GetMapping("/classes/{id}")
    public ResponseEntity<ClassDto> getClassDetails(@PathVariable Long id) {
        return ResponseEntity.ok(dataManagementService.getClassDetails(id));
    }

    @PutMapping("/classes/{id}")
    public ResponseEntity<ClassDto> updateClassDetails(@PathVariable Long id, @RequestBody Map<String, Object> details) {
        return ResponseEntity.ok(dataManagementService.toClassDtoPublic(dataManagementService.updateClassDetails(id, details)));
    }

    @GetMapping("/classes/{id}/teaching-faculty")
    public ResponseEntity<List<FacultyDto>> getFacultyTeachingClass(@PathVariable Long id) {
        return ResponseEntity.ok(dataManagementService.getFacultyTeachingClass(id));
    }

    @GetMapping("/classes/{id}/subject-assignments")
    public ResponseEntity<List<Map<String, Object>>> getClassSubjectAssignments(@PathVariable Long id) {
        return ResponseEntity.ok(dataManagementService.getClassSubjectAssignments(id));
    }

    @GetMapping("/classes/{id}/students")
    public ResponseEntity<List<StudentDto>> getStudentsByClassId(@PathVariable Long id) {
        return ResponseEntity.ok(dataManagementService.getStudentsByClassId(id));
    }




    @GetMapping("/class-curriculum")
    public ResponseEntity<List<ClassCurriculumDto>> listClassCurriculum() {
        return ResponseEntity.ok(classCurriculumService.listAll());
    }

    @PostMapping("/class-curriculum")
    public ResponseEntity<ClassCurriculumDto> createClassCurriculum(@RequestBody ClassCurriculumDto dto) {
        return ResponseEntity.ok(classCurriculumService.save(dto));
    }

    @PutMapping("/class-curriculum/{id}")
    public ResponseEntity<ClassCurriculumDto> updateClassCurriculum(
            @PathVariable Long id, @RequestBody ClassCurriculumDto dto) {
        dto.setId(id);
        return ResponseEntity.ok(classCurriculumService.save(dto));
    }

    @DeleteMapping("/class-curriculum/{id}")
    public ResponseEntity<Map<String, String>> deleteClassCurriculum(@PathVariable Long id) {
        classCurriculumService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    /**
     * Upload a weekly timetable image for a curriculum entry.
     * The image is stored under uploads/timetables/ and the URL saved in ClassCurriculum.
     */
    @PostMapping("/class-curriculum/{id}/timetable-image")
    public ResponseEntity<?> uploadTimetableImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "No file provided"));
            }
            // Store file in uploads/timetables/
            String uploadDir = System.getProperty("user.dir") + "/uploads/timetables/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String ext = "";
            String origName = file.getOriginalFilename();
            if (origName != null && origName.contains(".")) {
                ext = origName.substring(origName.lastIndexOf('.'));
            }
            String filename = "timetable_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path destPath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), destPath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/api/files/timetables/" + filename;
            classCurriculumService.setTimetableImage(id, imageUrl);
            return ResponseEntity.ok(Map.of("timetableImageUrl", imageUrl, "message", "Timetable image uploaded"));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to upload: " + e.getMessage()));
        }
    }

    @PostMapping("/classes/{id}/timetable-file")
    public ResponseEntity<?> uploadClassTimetableFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "No file provided"));
            String uploadDir = System.getProperty("user.dir") + "/uploads/timetables/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String ext = "";
            String origName = file.getOriginalFilename();
            if (origName != null && origName.contains(".")) {
                ext = origName.substring(origName.lastIndexOf('.'));
            }
            String filename = "class_timetable_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path destPath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), destPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/files/timetables/" + filename;
            dataManagementService.updateClassDetails(id, Map.of("timetableUrl", fileUrl));
            return ResponseEntity.ok(Map.of("fileUrl", fileUrl, "message", "Timetable file uploaded"));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to upload: " + e.getMessage()));
        }
    }

    @PostMapping("/classes/{id}/syllabus-file")
    public ResponseEntity<?> uploadClassSyllabusFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "No file provided"));
            String uploadDir = System.getProperty("user.dir") + "/uploads/syllabus/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String ext = "";
            String origName = file.getOriginalFilename();
            if (origName != null && origName.contains(".")) {
                ext = origName.substring(origName.lastIndexOf('.'));
            }
            String filename = "class_syllabus_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path destPath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), destPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/files/syllabus/" + filename;
            dataManagementService.updateClassDetails(id, Map.of("syllabusUrl", fileUrl));
            return ResponseEntity.ok(Map.of("fileUrl", fileUrl, "message", "Syllabus file uploaded"));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to upload: " + e.getMessage()));
        }
    }
    @Autowired(required = false)
    private com.college.smartattendance.util.DataSeeder dataSeeder;

    @PostMapping("/system/wipe")
    public ResponseEntity<Map<String, String>> wipeAllData() {
        try {
            dataManagementService.wipeAllData();
            return ResponseEntity.ok(Map.of("message", "System data wiped successfully. Only admin remains."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Wipe failed: " + e.getMessage()));
        }
    }

    @PostMapping("/system/seed")
    public ResponseEntity<Map<String, String>> triggerFullSeed() {
        if (dataSeeder == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Seeding is currently disabled in system configuration."));
        }
        try {
            dataSeeder.run();
            return ResponseEntity.ok(Map.of("message", "Full dataset seeded successfully. High-volume data generated."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Seeding failed: " + e.getMessage()));
        }
    }
}
