# Claims Confidence Backend

A robust claims management system built with Node.js, TypeScript, and MongoDB. This system allows for efficient handling of insurance claims, with features for both claimants and managers.

## Features

- 🔐 JWT-based Authentication
- 👥 Role-based Authorization (Managers & Claimants)
- 📝 CRUD Operations for Claims
- 📋 Comment System
- 📊 Status Workflow Management
- 📝 Audit Logging
- 🏢 Provider Management
- 🔍 Comprehensive Search & Filtering

## Requirements

- Node.js v20 or higher
- pnpm (Package Manager)
- MongoDB Atlas account
- Docker (optional)

## Project Architecture

The project follows a clean architecture pattern with the following structure:

```
src/
├── config/         # Configuration files and database setup
├── controllers/    # Request handlers
├── middlewares/    # Express middlewares
├── repositories/   # Data access layer
├── routes/         # API routes
├── services/       # Business logic
├── types/         # TypeScript interfaces and types
└── utils/         # Utility functions
```

### Key Components

- **Repository Pattern**: Abstracts database operations
- **Middleware Layer**: Handles authentication and request logging
- **Service Layer**: Contains business logic
- **Controller Layer**: Manages HTTP requests and responses

## Getting Started

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd claim-confidence-backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

4. **Build the project**
   ```bash
   pnpm build
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t claim-confidence-backend .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     --name claim-confidence-api \
     -p 3000:3000 \
     -e MONGODB_URI=your_mongodb_atlas_uri \
     -e JWT_SECRET=your_jwt_secret \
     claim-confidence-backend
   ```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### Claims
- `GET /claims` - Get all claims (filtered by user role)
- `POST /claims` - Create new claim (claimants only)
- `PATCH /claims/:id/status` - Update claim status
- `POST /claims/:id/comments` - Add comment to claim

### Logs
- `GET /logs` - Get all logs for authenticated user
- `GET /logs/claim/:claimId` - Get logs for specific claim
- `GET /logs/claim/:claimId/user` - Get user-specific logs for a claim

## Data Models

### Claim Status Workflow
```
PENDING → SUBMITTED → REVIEW → APPROVED/REJECTED
```

## Security

- JWT-based authentication
- Role-based access control
- Environment variable protection
- Request validation
- Error handling

## Error Handling

The API uses standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Contributing

1. Clone the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
