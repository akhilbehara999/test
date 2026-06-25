# MongoDB Integration Guide

This document explains how to set up and use MongoDB integration with the Smart Campus Bot application.

## Overview

The Smart Campus Bot application now supports MongoDB integration through a backend API. This allows for:

1. Centralized user management
2. Persistent data storage
3. Improved security with proper authentication
4. Better scalability

## Architecture

```
Frontend (Browser) ←→ Backend API (Node.js/Express) ←→ MongoDB Atlas
```

## Setup Instructions

### 1. Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Git (optional)

### 2. Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Run the setup script:
   ```
   npm run setup
   ```
   This will create a `.env` file with default configuration.

3. Edit the `.env` file to match your MongoDB Atlas connection:
   ```
   MONGODB_URI=mongodb+srv://akhilbehara:7013432177@2006@cluster0.r6z5ekb.mongodb.net/smartcampus?retryWrites=true&w=majority&appName=Cluster0
   ```

4. Install dependencies:
   ```
   npm install
   ```

5. Test the MongoDB connection:
   ```
   npm run test-connection
   ```

6. Start the backend server:
   ```
   npm start
   ```
   Or for development with auto-restart:
   ```
   npm run dev
   ```

### 3. Frontend Configuration

The frontend is already configured to work with the backend API. It will automatically detect if the backend is available and use it for authentication and data operations.

If the backend is not available, it will fall back to the original localStorage implementation.

## API Endpoints

The backend API provides the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change user password

### User Management
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)

### Health Check
- `GET /api/health` - Server health status

## Default Users

On first run, the backend will automatically create these default users:

1. **Student User**
   - Username: `student`
   - Password: `password123`
   - Role: `student`

2. **Admin User**
   - Username: `KAB`
   - Password: `7013432177@akhil`
   - Role: `admin`

3. **Test User**
   - Username: `testuser`
   - Password: `password`
   - Role: `student`
   - Status: `suspended`

## Security Features

1. **Password Hashing**: All passwords are securely hashed using bcrypt
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access**: Different permissions for students and admins
4. **Input Validation**: All inputs are validated and sanitized
5. **CORS Protection**: Cross-origin resource sharing protection

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify your MongoDB Atlas connection string
   - Ensure your IP address is whitelisted in MongoDB Atlas
   - Check that your MongoDB Atlas cluster is running

2. **CORS Errors**
   - Verify `CLIENT_URL` in `.env` matches your frontend URL
   - Ensure the backend server is running

3. **Authentication Errors**
   - Check that the backend server is running
   - Verify the JWT secret in `.env`

### Testing the Integration

1. Start both frontend and backend servers
2. Open your browser to `http://localhost:8000`
3. Try logging in with the default credentials
4. Check the browser console for any errors
5. Verify data is being stored in MongoDB Atlas

## Migration from localStorage

The application automatically migrates from localStorage to MongoDB when the backend is available. Existing users in localStorage will be preserved, but new authentication will use the backend.

## Contributing

To contribute to the MongoDB integration:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues with MongoDB integration, please:

1. Check the troubleshooting section above
2. Verify your MongoDB Atlas configuration
3. Review the backend logs for error messages
4. Open an issue on the repository if the problem persists