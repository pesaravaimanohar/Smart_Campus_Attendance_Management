package com.college.smartattendance.dto;

public class FacultySubjectAssignmentDto {
    private Long id;
    private Long facultyId;
    private String facultyName;
    private String facultyIdCode;
    private Long subjectId;
    private String subjectName;
    private String subjectCode;
    private Long classId;
    private String className;
    private Long academicYearId;
    private String academicYearName;
    private String section;
    private Boolean locked;

    public FacultySubjectAssignmentDto() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public String getFacultyIdCode() { return facultyIdCode; }
    public void setFacultyIdCode(String facultyIdCode) { this.facultyIdCode = facultyIdCode; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public Long getClassId() { return classId; }
    public void setClassId(Long classId) { this.classId = classId; }

    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }

    public Long getAcademicYearId() { return academicYearId; }
    public void setAcademicYearId(Long academicYearId) { this.academicYearId = academicYearId; }

    public String getAcademicYearName() { return academicYearName; }
    public void setAcademicYearName(String academicYearName) { this.academicYearName = academicYearName; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }

    public Boolean getLocked() { return locked; }
    public void setLocked(Boolean locked) { this.locked = locked; }
}
