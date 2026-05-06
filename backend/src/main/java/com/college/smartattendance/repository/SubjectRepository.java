package com.college.smartattendance.repository;

import com.college.smartattendance.entity.Subject;
import com.college.smartattendance.entity.SubjectType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    Optional<Subject> findByCodeIgnoreCase(String code);

    List<Subject> findBySubjectType(SubjectType subjectType);
}
