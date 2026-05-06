# System Credentials & User Patterns

This document provides the necessary login credentials for pre-seeded users and explains the default password patterns for newly created students and faculty.

---

## 🔑 Administrative & Leadership Accounts

| Role | Username | Password | Full Name |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin123` | System Admin |
| **Principal** | `PRN001` | `principal123` | P. Chenna Reddy Rao |

---

## 🏢 Departmental HOD Accounts

*All pre-seeded HOD accounts use the password: `hod123`*

| Department | Username | Full Name |
| :--- | :--- | :--- |
| **CSE** | `HOD_CSE` | B. Sathyanarayana |
| **ECE** | `HOD_ECE` | M. Murali Krishna |
| **EEE** | `HOD_EEE` | V. Ramana Murthy |
| **MECH** | `HOD_MECH` | K. Subba Reddy |
| **CIVIL** | `HOD_CIVIL` | P. Siva Kumar |
| **IT** | `HOD_IT` | M. Vijaya Kumar |

---

## 👨‍🏫 Faculty Accounts

*All pre-seeded faculty accounts use the password: `faculty123`*

| Department | Sample Usernames |
| :--- | :--- |
| **CSE** | `FAC_CSE01`, `FAC_CSE02`, `FAC_CSE03` |
| **ECE** | `FAC_ECE01`, `FAC_ECE02` |
| **EEE** | `FAC_EEE01`, `FAC_EEE02` |
| **MECH** | `FAC_MECH01`, `FAC_MECH02` |
| **CIVIL** | `FAC_CIVIL01`, `FAC_CIVIL02` |
| **IT** | `FAC_IT01`, `FAC_IT02` |

---

## 🎓 Student Accounts

### Pre-seeded Students
*All pre-seeded students use the password: `student123`*

Students are named following the JNTUA roll number pattern (e.g., `24X1A0501` for CSE, `24X1A0401` for ECE, etc.).
*   **CSE Year 1**: `24X1A0501` to `24X1A0560`
*   **ECE Year 1**: `24X1A0401` to `24X1A0460`
*   **MCA Year 1**: `24X1F0001` to `24X1F0020`

---

## 🛠️ Default Creation Patterns

When adding new users through the **Admin Dashboard** or **Bulk Upload**, the system follows these default credential rules:

### **1. Student Pattern**
*   **Username**: `roll_number` (converted to lowercase)
*   **Password**: `roll_number` (original casing -> upper case to login)
*   *Note: On first login, students are prompted to change their password.*

### **2. Faculty Pattern**
*   **Username**: `faculty_id` (converted to lowercase)
*   **Password**: `faculty_id` (original casing->upper case to login)
*   *Note: This applies to HOD and Principal roles created via the Admin panel.*

---
> [!IMPORTANT]
> For security, all users are encouraged to update their passwords via the **Profile Settings** after their initial login.
user passwords
username : password
principal: principal
fac_001: pradeep
