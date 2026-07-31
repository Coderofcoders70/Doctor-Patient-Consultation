# Doctor-Patient Consultation Backend

A robust RESTful API backend for a healthcare consultation platform built with **Node.js**, **Express**, **Prisma**, and **PostgreSQL**. Patients can securely register, browse available doctors, initiate consultations, and exchange real-time messages with their assigned medical professionals.

## Tech Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** PostgreSQL (Hosted on Supabase)
- **ORM:** Prisma 
- **Auth:** JWT with bcrypt (password hashing)
- **Deployment:** Docker Support Included

## Setup Instructions

### Prerequisites
- Node.js v18+
- Docker (Optional, for containerized running)
- A PostgreSQL database (e.g., Supabase)

### Environment Variables
Create a `.env` file in the root directory.

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection string for migrations/queries | `postgresql://postgres:password@host:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Direct DB connection string for Prisma | `postgresql://postgres:password@host:5432/postgres` |
| `JWT_SECRET` | Secret key for JWT signing | `super_secret_consultation_key_123` |
| `PORT` | Server port | `3000` |

### Github Repo:
Link: https://github.com/Coderofcoders70/Doctor-Patient-Consultation

### Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Push database schema to PostgreSQL
npx prisma db push

# 3. Generate Prisma client
npx prisma generate

# 4. Start the development server (uses nodemon)
npm run dev

# 1. Build the Docker image
docker build -t doctor-patient-api .

# 2. Run the container (maps port 3000 and loads .env)
docker run -p 3000:3000 --env-file .env doctor-patient-api

┌──────────┐       ┌───────────────┐       ┌──────────────┐       ┌──────────┐
│   User   │ 1──1  │ DoctorProfile │ 1──N  │ Consultation │ 1──N  │  Message │
├──────────┤       ├───────────────┤       ├──────────────┤       ├──────────┤
│ id (PK)  │       │ id (PK)       │       │ id (PK)      │       │ id (PK)  │
│ name     │       │ userId (FK)   │       │ patientId(FK)│       │ consultId│
│ email    │       │ specialization│       │ doctorId(FK) │       │ senderId │
│ password │       │ experience    │       │ status       │       │ message  │
│ role     │       │               │       │ createdAt    │       │ timestamp│
└──────────┘       └───────────────┘       └──────────────┘       └──────────┘

User → DoctorProfile: One-to-one (Created via Prisma Transaction during registration).

Consultation: Links patientId (User) and doctorId (User).

Message: Belongs to a specific Consultation and references a senderId (User).

EnumsRole: PATIENT | DOCTOR

Status: PENDING | ACTIVE | COMPLETED

```

## API Documentation

```

Note: A Postman collection is included in the root directory for instant testing.
All protected routes require the header: Authorization: Bearer <token>.

Authentication
POST /auth/register
Registers a new user (Patient or Doctor).
Uses a database transaction to ensure Doctor profiles are created safely.
Request Body:
JSON{
  "name": "Dr. Sarah Smith",
  "email": "sarah.smith@example.com",
  "password": "securepassword123",
  "role": "DOCTOR",
  "specialization": "Cardiology",
  "experience": 8
}

POST /auth/login
Authenticates a user and generates a JWT. Includes regex validation for email formatting.
Response (200):
JSON{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 2,
    "name": "Dr. Sarah Smith",
    "email": "sarah.smith@example.com",
    "role": "DOCTOR"
  }
}

GET /auth/profile
Fetches the logged-in user's profile, including nested doctor details if applicable.

Doctors
GET /doctors
Retrieves a list of all verified doctors. Access: PATIENT only.
Response (200):
JSON[
  {
    "id": 2,
    "name": "Dr. Sarah Smith",
    "specialization": "Cardiology",
    "experience": 8
  }
]

Consultations
POST /consultations
Initiates a new consultation. Access: PATIENT only.

GET /consultations?page=1&limit=5
Retrieves a paginated list of consultations for the authenticated user. Includes pagination metadata.
Response (200):
JSON{
  "data": [
    {
      "id": 1,
      "patientId": 5,
      "doctorId": 2,
      "status": "ACTIVE",
      "createdAt": "2026-07-31T08:27:29.062Z",
      "patient": { "name": "Teena" },
      "doctor": { "specialization": "Psychology", "user": { "name": "Dr. Sarah Smith" } }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 5,
    "totalPages": 1
  }
}

PATCH /consultations/:id/status
Updates the state of a consultation. Access: Assigned DOCTOR only.
Valid transitions block changes if already COMPLETED.

Chat (Messages)
POST /consultations/:id/messages
Sends a message to an active consultation.
Access: Assigned Patient or Doctor. Blocked if consultation is COMPLETED.

GET /consultations/:id/messages
Retrieves chronological message history for a consultation.
Response (200):
JSON[
  {
    "id": 1,
    "consultationId": 1,
    "message": "Hello Doctor, I've been having headaches recently.",
    "timestamp": "2026-07-31T09:06:49.496Z",
    "sender": {
      "name": "Teena",
      "role": "PATIENT"
    }
  }
]

```

# Project Structure

```
src/
├── app.js                  # Express application entry point
├── config/
│   └── db.js               # Prisma client initialization
├── controllers/
│   ├── authController.js   # Registration, Login, Profile
│   ├── chatController.js   # Messaging logic
│   ├── consultationController.js
│   └── doctorController.js
├── middleware/
│   └── authMiddleware.js   # JWT validation & Request augmentation
├── routes/
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   ├── consultationRoutes.js
│   └── doctorRoutes.js
