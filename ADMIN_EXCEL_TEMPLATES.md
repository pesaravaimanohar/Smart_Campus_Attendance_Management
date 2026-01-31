# Admin Dashboard - Excel Upload Templates

## Student Upload Template

Create an Excel file (.xlsx) with the following columns:

| Column | Field Name | Description | Example |
|--------|-----------|-------------|---------|
| A | Roll No | Student's roll number (will be username) | 21CS001 |
| B | Full Name | Student's full name | John Doe |
| C | DOB | Date of birth (YYYY-MM-DD) | 2003-05-15 |
| D | Department | Department name | Computer Science |
| E | Admission Year | Year of admission | 2021 |
| F | Gender | Gender (Male/Female/Other) | Male |
| G | Mobile Number | Contact number | 9876543210 |
| H | Email | Email address | john.doe@example.com |

**Note:** The first row should be headers. Data starts from row 2.

---

## Faculty Upload Template

Create an Excel file (.xlsx) with the following columns:

| Column | Field Name | Description | Example |
|--------|-----------|-------------|---------|
| A | Employee ID | Faculty's employee ID (will be username) | FAC001 |
| B | Full Name | Faculty's full name | Dr. Jane Smith |
| C | DOB | Date of birth (YYYY-MM-DD) | 1980-03-20 |
| D | Department | Department name | Computer Science |
| E | Designation | Job designation | Associate Professor |
| F | Role | Role (FACULTY/HOD/PRINCIPAL) | FACULTY |
| G | Gender | Gender (Male/Female/Other) | Female |
| H | Mobile Number | Contact number | 9876543211 |
| I | Email | Email address | jane.smith@example.com |

**Note:** 
- The first row should be headers. Data starts from row 2.
- Role must be one of: FACULTY, HOD, or PRINCIPAL (case-insensitive)
- HOD and PRINCIPAL will have additional privileges

---

## Default Password Generation

For both students and faculty, the default password is generated based on their date of birth:
- Format: `ddMMyyyy` (e.g., if DOB is 2003-05-15, password will be `15052003`)
- Users will be prompted to change their password on first login

---

## Class Creation

Classes can be created directly through the Admin Dashboard UI with the following fields:
- **Class Name**: e.g., "CSE 3rd Year A Section"
- **Department**: e.g., "Computer Science"
- **Year Level**: 1, 2, 3, or 4

---

## Important Notes

1. **Duplicate Prevention**: The system will skip users with duplicate usernames (Roll No/Employee ID)
2. **Data Validation**: Ensure all required fields are filled
3. **Date Format**: Always use YYYY-MM-DD format for dates
4. **File Format**: Only .xlsx files are supported
5. **Encoding**: Use UTF-8 encoding for special characters

---

## Sample Data

### Students Sample:
```
Roll No  | Full Name    | DOB        | Department          | Admission Year | Gender | Mobile     | Email
21CS001  | John Doe     | 2003-05-15 | Computer Science    | 2021          | Male   | 9876543210 | john@example.com
21CS002  | Jane Smith   | 2003-07-20 | Computer Science    | 2021          | Female | 9876543211 | jane@example.com
21EC001  | Bob Johnson  | 2003-03-10 | Electronics         | 2021          | Male   | 9876543212 | bob@example.com
```

### Faculty Sample:
```
Employee ID | Full Name        | DOB        | Department       | Designation          | Role      | Gender | Mobile     | Email
FAC001      | Dr. Alice Brown  | 1980-05-15 | Computer Science | Professor            | FACULTY   | Female | 9876543220 | alice@example.com
FAC002      | Dr. Robert Lee   | 1975-08-20 | Computer Science | Associate Professor  | HOD       | Male   | 9876543221 | robert@example.com
FAC003      | Dr. Mary Wilson  | 1970-12-10 | Electronics      | Professor            | PRINCIPAL | Female | 9876543222 | mary@example.com
```
