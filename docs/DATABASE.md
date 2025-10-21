# Modelo Relacional de Base de Datos - CMPC-libros

Este documento describe el modelo relacional completo del sistema de gestión de inventario de libros CMPC-libros.

## 🗄️ Visualización del Diagrama

### Opción 1: dbdiagram.io (Recomendado)
1. Ve a [https://dbdiagram.io/](https://dbdiagram.io/)
2. Crea una cuenta gratuita o usa como invitado
3. Copia el contenido del archivo `database-schema.dbml` 
4. Pégalo en el editor de dbdiagram.io
5. El diagrama se generará automáticamente

### Opción 2: Archivo DBML
Usa el archivo `database-schema.dbml` con cualquier herramienta compatible con el formato DBML.

## 📊 Estructura de la Base de Datos

### Entidades Principales

#### 1. **users** - Sistema de Autenticación
- **Propósito**: Gestión de usuarios y autenticación JWT
- **Características**: 
  - Control de intentos de login
  - Bloqueo temporal por seguridad
  - Tracking de último acceso
  - Roles de usuario

#### 2. **books** - Entidad Central del Sistema
- **Propósito**: Catálogo principal de libros con gestión de inventario
- **Características**:
  - Soft deletes habilitado
  - Gestión de stock en tiempo real
  - Soporte para imágenes de portada
  - ISBN único para identificación internacional

#### 3. **authors** - Catálogo de Autores
- **Propósito**: Información de autores de libros
- **Características**:
  - Biografía completa
  - Información demográfica
  - Soft deletes habilitado

#### 4. **publishers** - Catálogo de Editoriales
- **Propósito**: Información de casas editoriales
- **Características**:
  - Información histórica (año de fundación)
  - Datos geográficos
  - Soft deletes habilitado

#### 5. **genres** - Catálogo de Géneros
- **Propósito**: Clasificación de libros por género literario
- **Características**:
  - Nombres únicos
  - Descripciones detalladas
  - Soft deletes habilitado

#### 6. **audit_logs** - Sistema de Auditoría
- **Propósito**: Trazabilidad completa de operaciones del sistema
- **Características**:
  - Registro de todas las operaciones CRUD
  - Almacenamiento de valores anteriores y nuevos (JSONB)
  - Tracking de IP y User-Agent
  - Referencia opcional al usuario

## 🔗 Relaciones

### Relaciones One-to-Many
1. **authors** ← **books**: Un autor puede escribir múltiples libros
2. **publishers** ← **books**: Una editorial puede publicar múltiples libros  
3. **genres** ← **books**: Un género puede incluir múltiples libros
4. **users** ← **audit_logs**: Un usuario puede generar múltiples logs de auditoría

### Características de las Relaciones
- Todas las relaciones permiten valores NULL para flexibilidad
- Las foreign keys usan UUIDs para consistencia
- No hay restricciones de eliminación en cascada (se usa soft delete)

## 📈 Índices de Optimización

### Índices en books
- `idx_books_title`: Búsquedas por título
- `idx_books_isbn`: Búsquedas por ISBN (único)
- `idx_books_author`: Filtros por autor
- `idx_books_publisher`: Filtros por editorial  
- `idx_books_genre`: Filtros por género
- `idx_books_availability`: Consultas de disponibilidad
- `idx_books_created_at`: Ordenamiento temporal
- `idx_books_soft_delete`: Optimización para soft deletes

### Índices en audit_logs
- `idx_audit_user`: Filtros por usuario
- `idx_audit_table`: Filtros por tabla afectada
- `idx_audit_record`: Buscar auditoría de registro específico
- `idx_audit_action`: Filtros por tipo de acción
- `idx_audit_created_at`: Consultas temporales
- `idx_audit_table_record`: Búsquedas compuestas optimizadas

### Índices en users
- `idx_users_email`: Login por email (único)
- `idx_users_role`: Filtros por rol
- `idx_users_active`: Filtros por estado activo

## 🔐 Características de Seguridad

### Soft Deletes
- Implementado en: `books`, `authors`, `publishers`, `genres`
- Campo: `deleted_at` (timestamp nullable)
- Beneficio: Recuperación de datos, mantenimiento de integridad referencial

### Sistema de Auditoría
- **Registro automático** de todas las operaciones CRUD
- **Almacenamiento de valores**: antes y después de cada cambio
- **Trazabilidad de usuario**: IP, User-Agent, timestamp
- **Formato JSONB**: para consultas eficientes sobre cambios

### Autenticación y Control de Acceso
- **JWT tokens** para autenticación stateless
- **Control de intentos de login** con bloqueo temporal
- **Roles de usuario** para autorización granular
- **Tracking de sesiones** con IP y timestamp

## 💾 Tipos de Datos Especializados

### UUIDs
- Todas las primary keys usan UUID v4
- Beneficios: No secuenciales, distribuidos, únicos globalmente

### JSONB (PostgreSQL)
- Usado en `audit_logs` para `old_values` y `new_values`
- Permite consultas y índices sobre datos JSON
- Eficiente para almacenamiento de cambios dinámicos

### DECIMAL
- Precios almacenados como `DECIMAL(10,2)`
- Precisión exacta para cálculos monetarios

### INET
- Direcciones IP almacenadas nativamente
- Soporte para IPv4 e IPv6

## 📋 Estados del Sistema

### Estados de Disponibilidad de Libros
```typescript
enum book_availability_status {
  available      // Disponible (stock > 5)
  limited        // Pocas unidades (stock 1-5)  
  out_of_stock   // Agotado (stock = 0)
  unavailable    // No disponible (is_available = false)
}
```

### Acciones de Auditoría
```typescript
enum audit_actions {
  CREATE    // Creación de registros
  UPDATE    // Actualización de registros
  DELETE    // Eliminación (soft delete)
  LOGIN     // Inicio de sesión
  LOGOUT    // Cierre de sesión
  EXPORT    // Exportación de datos
}
```

### Roles de Usuario
```typescript
enum user_roles {
  admin      // Acceso completo al sistema
  user       // Acceso básico de lectura
  moderator  // Acceso intermedio para gestión de contenido
}
```

## 🚀 Consideraciones de Rendimiento

### Estrategias de Optimización
1. **Índices compuestos** para consultas frecuentes
2. **Paginación** implementada en todas las consultas de listado
3. **Soft deletes** para evitar problemas de integridad referencial
4. **JSONB** para almacenamiento eficiente de datos variables
5. **UUIDs** para escalabilidad horizontal futura

### Consultas Optimizadas
- Búsquedas de libros con filtros múltiples
- Auditoría por tabla y registro específico
- Consultas de disponibilidad de inventario
- Listados paginados con ordenamiento

## 📝 Notas de Implementación

### Sequelize ORM
- **Timestamps automáticos** en todas las tablas principales
- **Paranoid mode** habilitado para soft deletes
- **Validaciones a nivel de modelo** para integridad de datos
- **Asociaciones explícitas** para optimización de consultas

### PostgreSQL Específico
- Uso de características nativas como JSONB e INET
- Índices GIN automáticos en campos JSONB
- Soporte completo para UUID con extensión uuid-ossp

Este modelo está diseñado para escalabilidad, mantenibilidad y auditabilidad completa del sistema CMPC-libros.