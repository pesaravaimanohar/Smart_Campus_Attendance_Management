package com.college.smartattendance.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${file.upload-dir:uploads/profiles}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file, String userId) {
        // Validate file
        validateFile(file);

        // Generate unique filename
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = getFileExtension(originalFilename);
        String newFilename = userId + "_" + UUID.randomUUID().toString() + fileExtension;

        try {
            // Check if the file's name contains invalid characters
            if (newFilename.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + newFilename);
            }

            // Copy file to the target location (Replacing existing file with the same name)
            Path targetLocation = this.fileStorageLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Return the file download URI
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/")
                    .path(newFilename)
                    .toUriString();
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + newFilename + ". Please try again!", ex);
        }
    }

    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl != null && !fileUrl.isEmpty()) {
                // Extract filename from URL
                String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
                Path filePath = this.fileStorageLocation.resolve(filename).normalize();
                Files.deleteIfExists(filePath);
            }
        } catch (IOException ex) {
            // Log the error but don't throw exception
            System.err.println("Could not delete file: " + ex.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Failed to store empty file.");
        }

        // Check file size (2MB = 2 * 1024 * 1024 bytes)
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new RuntimeException("File size exceeds maximum limit of 2MB");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || !isValidImageType(contentType)) {
            throw new RuntimeException("Invalid file type. Only JPG, PNG, and WEBP images are allowed.");
        }
    }

    private boolean isValidImageType(String contentType) {
        return contentType.equals("image/jpeg") ||
                contentType.equals("image/jpg") ||
                contentType.equals("image/png") ||
                contentType.equals("image/webp");
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            throw new RuntimeException("Invalid filename");
        }
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            throw new RuntimeException("File must have an extension");
        }
        return filename.substring(lastDotIndex);
    }

    public Path getFileStorageLocation() {
        return fileStorageLocation;
    }
}
