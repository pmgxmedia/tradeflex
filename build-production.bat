@echo off
REM Production Build Script for EStore Application (Windows)
REM This script builds both frontend and backend for production deployment

echo ================================================
echo   EStore Production Build Script
echo ================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: package.json not found. Please run this script from the estore directory.
    exit /b 1
)

echo Step 1: Cleaning previous builds...
if exist "dist" rmdir /s /q dist
if exist "backend\node_modules\.cache" rmdir /s /q backend\node_modules\.cache
echo [OK] Cleanup complete
echo.

echo Step 2: Installing frontend dependencies...
call npm install --production=false
if errorlevel 1 (
    echo Error: Frontend dependency installation failed
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

echo Step 3: Building frontend for production...
call npm run build
if not exist "dist" (
    echo Error: Frontend build failed - dist directory not created
    exit /b 1
)
echo [OK] Frontend built successfully
echo.

echo Step 4: Installing backend dependencies...
cd backend
call npm install --production
cd ..
echo [OK] Backend dependencies installed
echo.

echo Step 5: Creating deployment package...
if not exist "deploy" mkdir deploy
xcopy /E /I /Y dist deploy\dist
xcopy /E /I /Y backend deploy\backend
copy ecosystem.config.cjs deploy\
copy backend\.env.production deploy\backend\.env.example
echo [OK] Deployment package created in .\deploy
echo.

echo ================================================
echo Build completed successfully!
echo ================================================
echo.
echo Next steps:
echo 1. Upload the 'deploy' folder to your server
echo 2. Set up environment variables in backend\.env
echo 3. Run 'pm2 start ecosystem.config.cjs' to start the backend
echo 4. Configure Nginx to serve the frontend from dist/
echo.
echo See DEPLOYMENT_GUIDE.md for detailed instructions
echo.

pause
