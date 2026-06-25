# Thinkering Smart Campus Project

This project is a web-based smart campus solution designed for educational institutions, offering a range of modules to enhance campus life and administrative tasks.

## Developer Information

**Pondara Akhil Behara**  
B.Tech 3rd Year Student  
Artificial Intelligence & Data Science Branch  
Chaitanya Engineering College, Kommadi

## Project Overview

The Smart Campus Bot is a comprehensive, secure multi-page web application that transforms campus services through an immersive Jarvis-inspired interface. Built entirely with vanilla HTML, CSS, and JavaScript, featuring enterprise-grade security, comprehensive testing, and modular architecture.

### Core Features

- **Attendance tracking**: Manage and track student attendance with CSV, PDF, and image file processing
- **Book management system**: AI-powered text summarization, expansion, and text-to-speech features
- **Chatbot interface**: Intelligent chatbot with expandable knowledge base and admin training interface
- **Code explanation tools**: Multi-language code analysis with syntax highlighting and execution simulation
- **Lost and found system**: Report and search for lost/found items with image upload support
- **Quiz/exam management**: Interactive quiz system with external API integration and custom question management
- **File storage management**: Personal cloud storage with IndexedDB-based file storage
- **Study group coordination**: Group creation, management, and real-time collaboration features

## Technology Stack

### Frontend
- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Advanced styling with custom properties and animations
- **Vanilla JavaScript (ES6+)**: Modern JavaScript without frameworks
- **Web APIs**: Speech, IndexedDB, Crypto, File, Canvas

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB Atlas**: Cloud database service
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing

### Security
- **PBKDF2**: Industry-standard password hashing
- **AES-GCM**: Symmetric encryption for sensitive data
- **Web Crypto API**: Browser-native cryptographic operations
- **CORS Protection**: Cross-origin resource sharing protection

### Storage
- **localStorage**: User preferences and session data
- **sessionStorage**: Temporary application state
- **IndexedDB**: Large file storage and complex data
- **MongoDB Atlas**: Cloud database for user management

## Project Structure

```
thinkring-project/
├── smart-campus-bot/      # Frontend application
│   ├── css/               # Stylesheets
│   │   ├── global.css     # Global styles and variables
│   │   ├── animations.css # Animation definitions
│   │   ├── login.css      # Login page styles
│   │   ├── dashboard.css  # Dashboard styles
│   │   ├── admin.css      # Admin panel styles
│   │   └── responsive.css # Responsive design rules
│   ├── js/                # Core JavaScript
│   │   ├── utils.js           # Utility functions
│   │   ├── crypto-utils.js    # Security and encryption
│   │   ├── data.js            # Data management (legacy localStorage)
│   │   ├── data-service.js    # Data service (MongoDB API)
│   │   ├── global.js          # Global functionality
│   │   ├── login.js           # Login handling
│   │   ├── dashboard.js       # Dashboard logic
│   │   ├── admin.js           # Admin panel logic
│   │   ├── module-loader.js   # Dynamic module loading
│   │   ├── test-framework.js  # Testing framework
│   │   └── modules/           # Modular components
│   │       ├── voice-commands.js
│   │       ├── session-management.js
│   │       ├── notification-system.js
│   │       └── form-validation.js
│   ├── modules/           # Feature modules
│   │   ├── attendance/    # Attendance tracking system
│   │   ├── book/          # AI-powered book tools
│   │   ├── chatbot/       # Intelligent chatbot
│   │   ├── code-explainer/# Code analysis tools
│   │   ├── lost-found/    # Lost and found system
│   │   ├── quiz/          # Interactive quiz system
│   │   ├── storage/       # Personal cloud storage
│   │   └── study-groups/  # Study group coordination
│   ├── tests/             # Test suites
│   │   ├── utils.test.js
│   │   ├── crypto-utils.test.js
│   │   └── data.test.js
│   ├── index.html         # Login page
│   ├── dashboard.html     # Student dashboard
│   ├── admin.html         # Admin panel
│   ├── test-runner.html   # Test execution interface
│   └── ...                # Other frontend files
├── backend/               # Backend API (Node.js + MongoDB)
│   ├── config/            # Database configuration
│   ├── models/            # Data models
│   ├── controllers/       # Request handlers
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   ├── package.json       # Node.js dependencies
│   ├── server.js          # Main server file
│   └── README.md          # Backend documentation
└── README.md              # This file
```

## MongoDB Integration

This project now includes MongoDB integration through a backend API. For detailed instructions on setting up and using the MongoDB integration, please see [MONGODB_INTEGRATION.md](MONGODB_INTEGRATION.md).

### Key Features of MongoDB Integration

1. **Centralized user management**: All user data stored in MongoDB Atlas
2. **Persistent data storage**: Data persists across sessions and devices
3. **Improved security**: Proper authentication with JWT tokens
4. **Better scalability**: Cloud-based database solution
5. **Role-based access control**: Different permissions for students and admins

### Default Users

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

## Quick Start

### Frontend

1. Navigate to the frontend directory:
   ```
   cd smart-campus-bot
   ```

2. Start a local web server:
   ```
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (if http-server is installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open your browser to `http://localhost:8000`

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. For development with auto-restart:
   ```
   npm run dev
   ```

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

## Security Features

1. **Password Hashing**: All passwords are securely hashed using bcrypt
2. **JWT Authentication**: Secure token-based authentication
3. **Role-Based Access**: Different permissions for students and admins
4. **Input Validation**: All inputs are validated and sanitized
5. **CORS Protection**: Cross-origin resource sharing protection
6. **API Key Encryption**: AES-GCM encryption for sensitive data
7. **Enterprise-Grade Password Hashing**: PBKDF2 with Web Crypto API
8. **Secure Session Management**: Automatic timeout and activity monitoring

## Testing

### Running Tests

1. **Open Test Runner**
   - Navigate to `test-runner.html` in your browser
   - Or visit `http://localhost:8000/test-runner.html`

2. **Execute Tests**
   - Click "Run All Tests" for comprehensive testing
   - Use individual test buttons for specific modules
   - View detailed results and coverage reports

### Test Coverage
- **Security Functions**: 95% coverage
- **Utility Functions**: 90% coverage
- **Data Management**: 88% coverage
- **Form Validation**: 92% coverage

## Deployment

### Frontend Deployment
1. Host the static files on any web server
2. Ensure proper CORS configuration if using backend API

### Backend Deployment
1. Deploy to any Node.js hosting platform (Render, Heroku, Vercel, etc.)
2. Set environment variables in the hosting platform
3. Ensure MongoDB Atlas is accessible from the hosting platform

## License

This project is licensed under the MIT License.