# Bachelor Mess Server

A Node.js/Express backend for the Bachelor Mess Manager mobile application.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **User Management**: Admin can manage members (CRUD operations)
- **Meal Management**: Members can submit daily meals, admins can approve/reject
- **Bazar Management**: Members can submit shopping entries with receipt images
- **File Upload**: Cloudinary integration for image storage
- **Statistics**: Comprehensive reporting and analytics

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + Cloudinary
- **Validation**: Mongoose validation
- **Logging**: Morgan + Winston

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for file uploads)

## Installation

1. **Clone the repository**

   ```bash
   cd bachelor-mess-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGO_URI=mongodb://localhost:27017/bachelor-mess
   # For MongoDB Atlas:
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/bachelor-mess

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/admin-only` - Admin-only test endpoint

### Users

- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `GET /api/users/all` - Get all users (admin only)
- `GET /api/users/:userId` - Get user by ID (admin only)
- `POST /api/users/create` - Create new user (admin only)
- `PUT /api/users/:userId` - Update user (admin only)
- `DELETE /api/users/:userId` - Delete user (admin only)
- `GET /api/users/:userId/stats` - Get user statistics (admin only)

### Meals

- `POST /api/meals/submit` - Submit daily meals
- `GET /api/meals/user` - Get user's meals
- `GET /api/meals/all` - Get all meals (admin only)
- `PUT /api/meals/:mealId/status` - Update meal status (admin only)
- `GET /api/meals/stats` - Get meal statistics (admin only)

### Bazar

- `POST /api/bazar/submit` - Submit bazar entry with receipt image
- `GET /api/bazar/user` - Get user's bazar entries
- `GET /api/bazar/all` - Get all bazar entries (admin only)
- `PUT /api/bazar/:bazarId/status` - Update bazar status (admin only)
- `GET /api/bazar/stats` - Get bazar statistics (admin only)

### Health Check

- `GET /api/health` - Server health check

## Data Models

### User

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: 'admin' | 'member',
  status: 'active' | 'inactive',
  joinDate: Date,
  timestamps: true
}
```

### Meal

```javascript
{
  userId: ObjectId (ref: User),
  date: Date,
  breakfast: Boolean,
  lunch: Boolean,
  dinner: Boolean,
  status: 'pending' | 'approved' | 'rejected',
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  notes: String,
  timestamps: true
}
```

### Bazar

```javascript
{
  userId: ObjectId (ref: User),
  date: Date,
  items: [{
    name: String,
    quantity: String,
    price: Number
  }],
  totalAmount: Number,
  description: String,
  receiptImage: String (Cloudinary URL),
  status: 'pending' | 'approved' | 'rejected',
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  notes: String,
  timestamps: true
}
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## File Upload

Bazar entries support receipt image uploads:

- Supported formats: JPG, PNG, GIF
- Maximum size: 5MB
- Images are stored on Cloudinary
- Returns secure URL for the uploaded image

## Error Handling

The API returns consistent error responses:

```javascript
{
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (not implemented yet)

### Project Structure

```
bachelor-mess-server/
├── controllers/     # Route handlers
├── models/         # Mongoose models
├── routes/         # Express routes
├── middleware/     # Custom middleware
├── uploads/        # File upload directory
├── .env           # Environment variables
├── package.json   # Dependencies
├── server.js      # Main server file
└── README.md      # This file
```

## Deployment

### Environment Variables for Production

- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure MongoDB Atlas connection
- Set up Cloudinary credentials
- Configure CORS origin for your domain

### Recommended Hosting

- **Backend**: Render, Railway, or Heroku
- **Database**: MongoDB Atlas
- **File Storage**: Cloudinary

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens have expiration
- File upload validation
- Input validation and sanitization
- CORS configuration
- Rate limiting (recommended for production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
