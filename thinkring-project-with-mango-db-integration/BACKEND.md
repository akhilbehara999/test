# Smart Campus Bot Backend API

This is the backend API for the Smart Campus Bot application, providing MongoDB integration for user management and authentication.

## Features

- MongoDB Atlas integration
- User authentication with JWT tokens
- Password hashing with bcrypt
- Role-based access control
- RESTful API design
- CORS support

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Git

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Create a `.env` file in the backend directory (copy from `.env.example` if available):
   ```env
   # MongoDB Atlas Connection
   MONGODB_URI=mongodb+srv://akhilbehara:7013432177@2006@cluster0.r6z5ekb.mongodb.net/smartcampus?retryWrites=true&w=majority&appName=Cluster0

   # Server Configuration
   PORT=3000
   JWT_SECRET=smartcampus_secret_key_2025

   # CORS Configuration
   CLIENT_URL=http://localhost:8000
   ```

2. Update the MongoDB connection string with your credentials if needed.

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change user password

### User Management
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)

### Health Check
- `GET /api/health` - Server health status

## Default Users

The system will automatically create these default users on first run:

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

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control
- Input validation and sanitization
- CORS protection

## Troubleshooting

### MongoDB Connection Issues

1. Verify your MongoDB Atlas connection string in `.env`
2. Ensure your IP address is whitelisted in MongoDB Atlas
3. Check that your MongoDB Atlas cluster is running

### Common Issues

1. **Port already in use**: Change the PORT in `.env`
2. **CORS errors**: Verify CLIENT_URL in `.env` matches your frontend URL
3. **JWT errors**: Ensure JWT_SECRET is set in `.env`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.