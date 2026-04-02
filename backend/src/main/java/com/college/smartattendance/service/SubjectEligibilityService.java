package com.college.smartattendance.service;

import com.college.smartattendance.entity.*;
import com.college.smartattendance.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectEligibilityService {

    @Autowired private FacultySubjectEligibilityRepository eligibilityRepository;
    @Autowired private FacultyRepository facultyRepository;
    @Autowired private SubjectRepository subjectRepository;
    @Autowired private AuditService auditService;

    @Transactional
    public FacultySubjectEligibility addEligibility(Long facultyId, Long subjectId, Long addedBy) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found: " + facultyId));
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found: " + subjectId));

        if (eligibilityRepository.existsByFacultyIdAndSubjectId(facultyId, subjectId))
            throw new RuntimeException("Eligibility already exists");

        FacultySubjectEligibility eligibility = new FacultySubjectEligibility(faculty, subject, addedBy);
        eligibility = eligibilityRepository.save(eligibility);

        auditService.logAction(addedBy, "FacultySubjectEligibility", eligibility.getId(), "CREATED",
                null, "Faculty " + faculty.getFacultyId() + " eligible for " + subject.getName(), null);
        return eligibility;
    }

    @Transactional
    public void removeEligibility(Long eligibilityId, Long removedBy) {
        FacultySubjectEligibility eligibility = eligibilityRepository.findById(eligibilityId)
                .orElseThrow(() -> new RuntimeException("Eligibility not found: " + eligibilityId));
        String log = "Faculty " + eligibility.getFaculty().getFacultyId()
                + " eligible for " + eligibility.getSubject().getName();
        eligibilityRepository.delete(eligibility);
        auditService.logAction(removedBy, "FacultySubjectEligibility", eligibilityId, "DELETED",
                log, null, null);
    }

    public List<Subject> getEligibleSubjects(Long facultyId) {
        return eligibilityRepository.findByFacultyId(facultyId).stream()
                .map(FacultySubjectEligibility::getSubject).collect(Collectors.toList());
    }

    public List<Faculty> getEligibleFaculty(Long subjectId) {
        return eligibilityRepository.findBySubjectId(subjectId).stream()
                .map(FacultySubjectEligibility::getFaculty).collect(Collectors.toList());
    }

    public boolean isEligible(Long facultyId, Long subjectId) {
        return eligibilityRepository.existsByFacultyIdAndSubjectId(facultyId, subjectId);
    }

    public List<FacultySubjectEligibility> getFacultyEligibilities(Long facultyId) {
        return eligibilityRepository.findByFacultyId(facultyId);
    }

    @Transactional
    public int bulkAddEligibilities(Long facultyId, List<Long> subjectIds, Long addedBy) {
        int count = 0;
        for (Long subjectId : subjectIds) {
            try {
                if (!eligibilityRepository.existsByFacultyIdAndSubjectId(facultyId, subjectId)) {
                    addEligibility(facultyId, subjectId, addedBy);
                    count++;
                }
            } catch (Exception e) {
                System.err.println("Failed to add eligibility for subject " + subjectId + ": " + e.getMessage());
            }
        }
        return count;
    }
}
