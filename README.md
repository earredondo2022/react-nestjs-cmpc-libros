# CMPC-libros - Sistema de Gestión de Inventario de Libros

![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)
![NestJS](https://img.shields.io/badge/NestJS-10.2.7-red?logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

Una aplicación web completa para la gestión de inventario de la tienda CMPC-libros, desarrollada con React + TypeScript en el frontend y NestJS + TypeScript en el backend, utilizando PostgreSQL como base de datos.

## 🌟 Demo en Vivo
- **Frontend**: [http://localhost:3000](http://localhost:3000) (ejecutar con Docker)
- **API Swagger**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

## 📸 Screenshots
*Próximamente: Capturas de pantalla de la aplicación*

## 🚀 Características Principales

### Frontend (React + TypeScript)
- ✅ Sistema de autenticación JWT
- ✅ Listado de libros con filtrado avanzado y paginación
- ✅ Búsqueda en tiempo real con debounce
- ✅ Formularios reactivos con validación
- ✅ Carga de imágenes de libros
- ✅ Interfaz responsive con Tailwind CSS
- ✅ Gestión de estado con Redux Toolkit
- ✅ Manejo de errores y notificaciones

### Backend (NestJS + TypeScript)
- ✅ Arquitectura modular siguiendo principios SOLID
- ✅ Autenticación JWT con Passport
- ✅ API RESTful completa con Swagger
- ✅ Soft delete para manejo de eliminaciones
- ✅ Sistema de auditoría y logging
- ✅ Exportación de datos en CSV
- ✅ Validación de datos con class-validator
- ✅ Interceptores para transformación de respuestas
- ✅ Rate limiting y seguridad

### Base de Datos (PostgreSQL + Sequelize)
- ✅ Modelo de datos normalizado
- ✅ Relaciones entre tablas optimizadas
- ✅ Índices para consultas eficientes
- ✅ Transacciones para integridad de datos
- ✅ Auditoría completa de operaciones

## 📋 Requisitos del Sistema

- Node.js >= 18.x
- Docker y Docker Compose
- PostgreSQL >= 13 (si no usa Docker)

## 🛠️ Instalación y Configuración

### Opción 1: Con Docker (Recomendado)

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd react-nestjs-cmpc-libros
```

2. **Construir y ejecutar con Docker Compose**
```bash
docker-compose up --build
```

Esto iniciará todos los servicios:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger docs: http://localhost:3001/api/docs
- PostgreSQL: localhost:5432

### Opción 2: Instalación Manual

#### Backend

1. **Navegar al directorio del backend**
```bash
cd backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=cmpc_libros
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres123
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
NODE_ENV=development
```

4. **Ejecutar migraciones de base de datos**
```bash
npm run migration:run
```

5. **Iniciar el servidor**
```bash
npm run start:dev
```

#### Frontend

1. **Navegar al directorio del frontend**
```bash
cd frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env`:
```env
REACT_APP_API_URL=http://localhost:3001
```

4. **Iniciar la aplicación**
```bash
npm start
```

## 🏗️ Arquitectura del Sistema

### Estructura del Proyecto
```
react-nestjs-cmpc-libros/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/           # Módulo de autenticación
│   │   ├── users/          # Gestión de usuarios
│   │   ├── books/          # Gestión de libros
│   │   ├── authors/        # Gestión de autores
│   │   ├── publishers/     # Gestión de editoriales
│   │   ├── genres/         # Gestión de géneros
│   │   └── audit/          # Sistema de auditoría
│   ├── uploads/            # Archivos subidos
│   └── test/               # Tests
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── services/       # Servicios API
│   │   ├── store/          # Estado global (Redux)
│   │   ├── contexts/       # Context providers
│   │   └── utils/          # Utilidades
├── database/               # Scripts de base de datos
├── docker-compose.yml      # Configuración Docker
└── README.md
```

### Modelo de Base de Datos

#### Entidades Principales
- **Users**: Usuarios del sistema (admin/user)
- **Books**: Catálogo de libros
- **Authors**: Autores de libros
- **Publishers**: Editoriales
- **Genres**: Géneros literarios
- **AuditLogs**: Registro de auditoría

#### Relaciones
- Un libro pertenece a un autor, editorial y género
- Un autor puede tener múltiples libros
- Una editorial puede publicar múltiples libros
- Un género puede categorizar múltiples libros
- Todas las operaciones se registran en audit_logs

## 🧪 Testing

### Backend
```bash
cd backend

# Tests unitarios
npm run test

# Tests con cobertura
npm run test:cov

# Tests e2e
npm run test:e2e
```

### Frontend
```bash
cd frontend

# Tests unitarios
npm test

# Tests con cobertura
npm test -- --coverage
```

## 📊 Uso de la Aplicación

### Credenciales por Defecto
- **Email**: admin@cmpc-libros.com
- **Password**: admin123

### Funcionalidades Principales

#### Gestión de Libros
1. **Listado**: Ver todos los libros con paginación
2. **Filtrado**: Por género, editorial, autor, disponibilidad
3. **Búsqueda**: Búsqueda en tiempo real por título
4. **Ordenamiento**: Por título, precio, fecha, etc.
5. **CRUD**: Crear, leer, actualizar, eliminar libros
6. **Imágenes**: Subir y gestionar imágenes de portada

#### Gestión de Catálogos
- **Autores**: Gestión completa de autores
- **Editoriales**: Gestión de casas editoriales
- **Géneros**: Categorización de libros

#### Reportes y Exportación
- **CSV**: Exportar datos de libros
- **Auditoría**: Historial completo de operaciones

## 🔧 Configuración Avanzada

### Variables de Entorno del Backend
```env
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=cmpc_libros
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres123

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

# Servidor
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000

# Archivos
MAX_FILE_SIZE=5242880  # 5MB
UPLOAD_PATH=./uploads
```

### Variables de Entorno del Frontend
```env
# API
REACT_APP_API_URL=http://localhost:3001

# Configuración
REACT_APP_APP_NAME=CMPC-libros
REACT_APP_VERSION=1.0.0
```

## 🚀 Despliegue en Producción

### Con Docker
```bash
# Producción
docker-compose -f docker-compose.prod.yml up -d
```

### Manual
1. Configurar variables de entorno de producción
2. Construir aplicaciones:
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```
3. Configurar servidor web (nginx) para servir el frontend
4. Configurar reverse proxy para la API

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit de cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a base de datos**
   - Verificar que PostgreSQL esté ejecutándose
   - Revisar las credenciales en variables de entorno

2. **Error CORS**
   - Verificar FRONTEND_URL en variables de entorno del backend

3. **Archivos no se suben**
   - Verificar permisos de la carpeta `uploads`
   - Comprobar tamaño máximo de archivo

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

**CMPC-libros** - Digitalizando la gestión de inventario de libros 📚