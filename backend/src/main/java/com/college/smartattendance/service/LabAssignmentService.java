package com.college.smartattendance.service;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LabAssignmentService {

    @Autowired
    private LabFacultyAssignmentRepository labFacultyAssignmentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private CourseClassRepository courseClassRepository;

    @Autowired
    private AcademicYearRepository academicYearRepository;

    /**
     * Assign faculty to a lab (up to 3 faculty)
     */
    public List<LabFacultyAssignment> assignFacultyToLab(Long labSubjectId, List<Long> facultyIds,
                                                          Long classId, Long academicYearId, Long userId) {
        // Validate lab subject exists and is of type LAB
        Subject labSubject = subjectRepository.findById(labSubjectId)
                .orElseThrow(() -> new RuntimeException("Lab Subject not found"));

        if (!SubjectType.LAB.equals(labSubject.getSubjectType())) {
            throw new RuntimeException("Subject is not of type LAB");
        }

        // Validate maximum 3 faculty
        if (facultyIds.size() > 3) {
            throw new RuntimeException("Maximum 3 faculty can be assigned to a lab");
        }

        // Validate class exists
        CourseClass courseClass = courseClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Course Class not found"));

        // Validate academic year exists
        AcademicYear academicYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new RuntimeException("Academic Year not found"));

        List<LabFacultyAssignment> assignments = new java.util.ArrayList<>();

        for (Long facultyId : facultyIds) {
            // Check if faculty is already assigned and active to this lab
            if (labFacultyAssignmentRepository.existsByLabSubject_IdAndFaculty_IdAndCourseClass_IdAndActive(
                    labSubjectId, facultyId, classId, true)) {
                throw new RuntimeException("Faculty member is already assigned and active for this lab");
            }

            Faculty faculty = facultyRepository.findById(facultyId)
                    .orElseThrow(() -> new RuntimeException("Faculty not found"));

            LabFacultyAssignment assignment = new LabFacultyAssignment();
            assignment.setLabSubject(labSubject);
            assignment.setFaculty(faculty);
            assignment.setCourseClass(courseClass);
            assignment.setAcademicYear(academicYear);
            assignment.setAssignedBy(userId);
            assignment.setActive(true);

            assignments.add(labFacultyAssignmentRepository.save(assignment));
        }

        return assignments;
    }

    /**
     * Get all faculty assigned to a lab
     */
    public List<LabFacultyAssignment> getLabFaculty(Long labSubjectId, Long classId) {
        return labFacultyAssignmentRepository.findByLabSubject_IdAndCourseClass_Id(labSubjectId, classId);
    }

    /**
     * Get all active labs a faculty is assigned to
     */
    public List<LabFacultyAssignment> getFacultyActiveLabs(Long facultyId) {
        return labFacultyAssignmentRepository.findActiveLabs(facultyId);
    }

    /**
     * Verify if faculty is assigned to lab
     */
    public boolean isFacultyAssignedToLab(Long facultyId, Long labSubjectId, Long classId) {
        return labFacultyAssignmentRepository.existsByLabSubject_IdAndFaculty_IdAndCourseClass_Id(
                labSubjectId, facultyId, classId);
    }

    /**
     * Remove faculty from lab
     */
    public void removeFacultyFromLab(Long assignmentId, Long userId) {
        LabFacultyAssignment assignment = labFacultyAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        assignment.setActive(false);
        labFacultyAssignmentRepository.save(assignment);
    }

    /**
     * Update faculty in lab (replace one faculty with another)
     */
    public LabFacultyAssignment updateLabFaculty(Long assignmentId, Long newFacultyId, Long userId) {
        LabFacultyAssignment assignment = labFacultyAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // Check if new faculty is already assigned to this lab
        if (labFacultyAssignmentRepository.existsByLabSubject_IdAndFaculty_IdAndCourseClass_Id(
                assignment.getLabSubject().getId(), newFacultyId, assignment.getCourseClass().getId())) {
            throw new RuntimeException("New faculty is already assigned to this lab");
        }

        Faculty newFaculty = facultyRepository.findById(newFacultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        assignment.setFaculty(newFaculty);
        return labFacultyAssignmentRepository.save(assignment);
    }

    /**
     * Get count of faculty assigned to a lab
     */
    public long getLabFacultyCount(Long labSubjectId, Long classId) {
        return labFacultyAssignmentRepository.countByLabSubject_IdAndCourseClass_Id(labSubjectId, classId);
    }

    /**
     * Deactivate all assignments for a lab
     */
    public void deactivateLabAssignments(Long labSubjectId, Long classId) {
        List<LabFacultyAssignment> assignments = labFacultyAssignmentRepository
                .findByLabSubject_IdAndCourseClass_Id(labSubjectId, classId);

        for (LabFacultyAssignment assignment : assignments) {
            assignment.setActive(false);
            labFacultyAssignmentRepository.save(assignment);
        }
    }

    /**
     * Get all active lab assignments
     */
    public List<LabFacultyAssignment> getAllActiveAssignments() {
        return labFacultyAssignmentRepository.findAll();
    }
}
