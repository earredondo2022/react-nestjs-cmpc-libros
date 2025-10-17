# Guía de Conexión DBeaver para CMPC-libros

## 🔧 Configuración de Conexión en DBeaver

### Credenciales Confirmadas:
- **Host**: `localhost`
- **Puerto**: `5433` ⚠️ (CAMBIADO - No es el puerto estándar 5432)
- **Base de datos**: `cmpc_libros`
- **Usuario**: `postgres`
- **Contraseña**: `postgres123`

### 📋 Pasos Detallados:

#### 1. Crear Nueva Conexión
1. Abrir DBeaver
2. Click en "Nueva Conexión" (ícono de enchufe + )
3. Seleccionar **PostgreSQL**
4. Click "Siguiente"

#### 2. Configuración Principal
```
Servidor: localhost
Puerto: 5433  ⚠️ IMPORTANTE: No usar 5432
Base de datos: cmpc_libros
Nombre de usuario: postgres
Contraseña: postgres123
```

#### 3. Configuración Avanzada
- En la pestaña **"General"**:
  - Marcar "Mostrar todas las bases de datos"
  - Connection name: `CMPC-libros Local`

- En la pestaña **"SSL"**:
  - SSL mode: `disable` (importante para conexiones locales)

#### 4. Probar Conexión
- Click en "Probar Conexión"
- Debe mostrar: "Conectado"

### 🔍 Solución de Problemas

#### Error: "Connection refused"
- Verificar que Docker esté ejecutándose
- Ejecutar: `docker-compose up -d`
- Verificar puertos: `docker-compose ps`

#### Error: "Authentication failed"
- Verificar credenciales exactas:
  - Usuario: `postgres` (no `admin`)
  - Contraseña: `postgres123` (con números)

#### Error: "Database does not exist"
- Usar base de datos: `cmpc_libros` (con guión bajo)
- O conectar primero a `postgres` (base por defecto)

#### Error: "Driver not found"
- En DBeaver: Database → Driver Manager
- Descargar driver PostgreSQL más reciente

### 🗄️ Tablas Disponibles
Una vez conectado, deberías ver estas tablas:
- `audit_logs` - Registro de auditoría
- `authors` - Autores de libros
- `books` - Catálogo de libros
- `genres` - Géneros literarios
- `publishers` - Editoriales
- `users` - Usuarios del sistema

### 📊 Datos de Prueba
El sistema incluye datos de prueba iniciales:
- Usuario admin: admin@cmpc-libros.com
- Libros de ejemplo
- Autores y géneros predefinidos

### 🐛 Comandos de Diagnóstico

#### Verificar que PostgreSQL esté corriendo:
```bash
docker-compose ps postgres
```

#### Ver logs de PostgreSQL:
```bash
docker-compose logs postgres
```

#### Conectar directamente al contenedor:
```bash
docker exec -it cmpc-libros-db psql -U postgres -d cmpc_libros
```

#### Verificar puerto en uso:
```powershell
Get-NetTCPConnection -LocalPort 5432
```

### 🔄 Reiniciar Servicios
Si hay problemas, reiniciar todo:
```bash
docker-compose down
docker-compose up -d
```

---

**¿Sigue sin funcionar?**
1. Verificar que no haya otro PostgreSQL corriendo en puerto 5432
2. Revisar firewall de Windows
3. Probar con IP `127.0.0.1` en lugar de `localhost`
4. Verificar que Docker Desktop esté corriendo correctamente