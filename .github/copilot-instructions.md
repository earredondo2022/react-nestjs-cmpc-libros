# CMPC-libros Project Instructions

This is a full-stack web application for book inventory management built with:

## Technology Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeScript + Sequelize ORM  
- **Database**: PostgreSQL
- **DevOps**: Docker + Docker Compose

## Project Structure
- `backend/` - NestJS API server
- `frontend/` - React application
- `database/` - Database initialization scripts
- `uploads/` - File uploads directory
- `docker-compose.yml` - Full stack orchestration

## Quick Start
1. **With Docker** (recommended): `docker-compose up --build`
2. **Manual setup**: Install dependencies in both frontend and backend directories

## Key Features Implemented
✅ JWT Authentication system
✅ Complete CRUD operations for books
✅ File upload for book covers
✅ Advanced filtering and search
✅ Audit logging system  
✅ Soft delete functionality
✅ API documentation with Swagger
✅ Responsive UI with Tailwind CSS
✅ Docker deployment ready

## Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger docs: http://localhost:3001/api/docs
- Default login: admin@cmpc-libros.com / admin123

## Development Notes
- Follow SOLID principles in backend architecture
- Use TypeScript strict mode
- Implement proper error handling
- Maintain code coverage above 80%
- Use semantic commit messages