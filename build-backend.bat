@echo off
echo ======================================
echo Building Smart Attendance Backend
echo ======================================
echo.

cd backend

echo Cleaning previous build...
call mvn clean

echo.
echo Compiling Java sources...
call mvn compiler:compile -X > build-log.txt 2>&1

echo.
echo.
echo ======================================
echo Build Log Summary:
echo ======================================
findstr /C:"[ERROR]" build-log.txt | findstr /V "MAVEN" |find str /V "Help"

echo.
echo Full build log saved to: backend\build-log.txt
echo.
pause
