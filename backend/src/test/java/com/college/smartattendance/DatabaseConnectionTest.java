package com.college.smartattendance;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void testConnection() throws Exception {
        java.io.FileWriter fw = new java.io.FileWriter("connection_result.txt");
        try {
            fw.write("--- START CONNECTION TEST ---\n");
            try (Connection connection = dataSource.getConnection()) {
                fw.write("URL: " + connection.getMetaData().getURL() + "\n");
                assertThat(connection.isValid(1)).isTrue();
                fw.write("Connection Validity: VALID\n");

                // Check for a known table
                ResultSet rs = connection.getMetaData().getTables(null, null, "faculty", null);
                if (rs.next()) {
                    fw.write("Found table 'faculty'. Database seems correct.\n");
                } else {
                    fw.write("Table 'faculty' NOT found. Database might be wrong or empty.\n");
                    // Try to list what tables ARE there
                    ResultSet allTables = connection.getMetaData().getTables(null, null, "%", new String[] { "TABLE" });
                    fw.write("Tables found in current DB:\n");
                    boolean any = false;
                    while (allTables.next()) {
                        fw.write(" - " + allTables.getString("TABLE_NAME") + "\n");
                        any = true;
                    }
                    if (!any)
                        fw.write(" - [No tables found]\n");
                }

                // Count users
                try (java.sql.Statement stmt = connection.createStatement();
                        ResultSet rsCount = stmt.executeQuery("SELECT count(*) FROM users")) {
                    if (rsCount.next()) {
                        fw.write("Users count in 'smart_attendance': " + rsCount.getInt(1) + "\n");
                    }
                } catch (Exception e) {
                    fw.write("Could not count users: " + e.getMessage() + "\n");
                }

            } catch (Exception e) {
                fw.write("CONNECTION FAILED: " + e.getMessage() + "\n");
                e.printStackTrace();
                throw e;
            }

            // Check secondary DB
            String url2 = "jdbc:mysql://localhost:3306/smart_attendance_db?useSSL=false&allowPublicKeyRetrieval=true";
            try (Connection conn2 = java.sql.DriverManager.getConnection(url2, "root", "root")) {
                fw.write("Also found 'smart_attendance_db' and connected successfully.\n");
            } catch (Exception e) {
                fw.write("Could NOT connect to 'smart_attendance_db': " + e.getMessage() + "\n");
            }

            fw.write("--- END CONNECTION TEST ---\n");
        } finally {
            fw.close();
        }
    }
}
