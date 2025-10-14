# OTP Manager

A full-stack application for managing One-Time Password (OTP) across multiple platforms. The system consists of a NestJS backend API and a React frontend interface with internationalization support.
![screenshot](assets/screenshot.png)
## 🌟 Features

- **User Authentication**
    - Secure JWT-based authentication
    - Registration and login with OTP support (using TOTP)
    - Password management and change functionality
- **Platform Management**
    - Create and manage authentication platforms
    - Associate user accounts with platforms
- **Internationalization**
    - Multi-language support (English, Simplified Chinese, Traditional Chinese)
    - Language switching capability
- **Modern UI**
    - Responsive dashboard interface
    - Theme support

## 🛠 Tech Stack

### Backend (apps/api)
- **Framework**: NestJS 11
- **Database**: Prisma .prisma with Sqlite
- **Authentication**: JWT, Passport.js, speakeasy (OTP)
- **Validation**: class-validator, class-transformer
- **Testing**: Jest, Supertest
- **Other**: i18n, Helmet security headers

### Frontend (apps/web)
- **Framework**: React 19
- **State Management**: Zustand
- **Styling**: Tailwind CSS, Headless UI
- **Routing**: React Router 7
- **i18n**: i18next
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Shared
- TypeScript
- Monorepo structure (pnpm workspace)
- ESLint + Prettier
- Jest for testing

## 🐳 Usage(Docker Container)

**Quick Start**
```bash
# Run with Docker Compose (recommended):
docker compose -f docker/docker-compose.yaml up -d
```

```bash
# Alternative Run with Docker:
docker run -d --name otp-manager \
  -p 80:80 \
  -v $(pwd)/data:/app/data \
  ghcr.io/malonzhao/otp-manager:latest
```
**Additional Environment Variables**
```dotenv
# 32-byte encryption key for encrypting sensitive OTP data
# DO NOT use default key in production - must be changed and kept secure
ENCRYPTION_KEY=abcdefghijklmnopqrstuvwxyz123456

# Secret key used for signing JWT access tokens
# Unique value required in production - should be 32+ characters
JWT_SECRET=otp_manager_secret_key

# Secret key for signing JWT refresh tokens
# Must be different from JWT_SECRET for security
JWT_REFRESH_SECRET=otp_manager_refresh_secret_key

# Access token expiration time in seconds
# 3600 = 1 hour, adjust based on security requirements
JWT_EXPIRES_IN=3600

# Database connection string in Prisma format for sqlite
DATABASE_URL="file:/app/data/otp.db"
```

## 🚀 Development

### Prerequisites
- Node.js v22+
- pnpm v10+

### Setup
1. Install dependencies:
```bash
pnpm install
```

2. Generate prisma ORM files
```bash
pnpm -F @otp-manager/api prisma:generate
```

3. Set up environment variables:
```bash
cp apps/api/.env.example apps/api/.env
# Edit .env with your database connection
```

4. Run database migrations:
```bash
pnpm -F @otp-manager/api db:migrate
```

5. Execute seed data population:
```bash
pnpm -F @otp-manager/api db:seed
```

## 🏃‍♂️ Running the Application

Start both services in separate terminals:

```bash
pnpm dev
```

The application will be available at:
- API: `http://localhost:3000`
- Web: `http://localhost:5173`

Default account credentials: `admin@example.com` / `admin123`

## 🧪 Testing

Run tests for specific applications:

```bash
# Backend tests
pnpm --filter @otp-manager/api test

# Frontend tests
pnpm --filter @otp-manager/web test
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
