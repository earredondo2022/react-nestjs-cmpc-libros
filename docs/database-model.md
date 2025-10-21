# Modelo Relacional - CMPC-libros

## Diagrama de Entidad-Relación (ASCII)

```
                    ┌─────────────────┐
                    │     users       │
                    │─────────────────│
                    │ 🔑 id (UUID)    │
                    │ 📧 email        │
                    │ 🔒 password     │
                    │ 👤 first_name   │
                    │ 👤 last_name    │
                    │ 🎭 role         │
                    │ ✅ is_active    │
                    │ 🕐 last_login   │
                    │ 🌐 last_login_ip│
                    │ 🔢 login_attempts│
                    └─────────────────┘
                            │
                            │ (optional)
                            ▼
                    ┌─────────────────┐
                    │   audit_logs    │
                    │─────────────────│
                    │ 🔑 id (UUID)    │
                    │ 👤 user_id      │
                    │ ⚡ action       │
                    │ 📋 table_name   │
                    │ 🎯 record_id    │
                    │ 📊 old_values   │
                    │ 📊 new_values   │
                    │ 🌐 ip_address   │
                    │ 🖥️ user_agent   │
                    │ 🕐 created_at   │
                    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    authors      │    │   publishers    │    │     genres      │
│─────────────────│    │─────────────────│    │─────────────────│
│ 🔑 id (UUID)    │    │ 🔑 id (UUID)    │    │ 🔑 id (UUID)    │
│ 👨‍💼 name        │    │ 🏢 name         │    │ 📚 name         │
│ 📖 biography    │    │ 🌍 country      │    │ 📝 description  │
│ 🎂 birth_date   │    │ 📅 founded_year │    │ 🕐 created_at   │
│ 🌍 nationality  │    │ 🕐 created_at   │    │ 🕐 updated_at   │
│ 🕐 created_at   │    │ 🕐 updated_at   │    │ 🗑️ deleted_at   │
│ 🕐 updated_at   │    │ 🗑️ deleted_at   │    └─────────────────┘
│ 🗑️ deleted_at   │    └─────────────────┘            │
└─────────────────┘            │                       │
         │                     │                       │
         │                     │                       │
         │                     ▼                       │
         │            ┌─────────────────┐              │
         └───────────▶│     books       │◀─────────────┘
                      │─────────────────│
                      │ 🔑 id (UUID)    │
                      │ 📖 title        │
                      │ 📊 isbn         │
                      │ 💰 price        │
                      │ 📦 stock_quantity│
                      │ ✅ is_available │
                      │ 📅 publication_date│
                      │ 📄 pages        │
                      │ 📝 description  │
                      │ 🖼️ image_url    │
                      │ 👨‍💼 author_id    │ (FK)
                      │ 🏢 publisher_id │ (FK)
                      │ 📚 genre_id     │ (FK)
                      │ 🕐 created_at   │
                      │ 🕐 updated_at   │
                      │ 🗑️ deleted_at   │
                      └─────────────────┘
```

## Leyenda de Símbolos

| Símbolo | Significado |
|---------|-------------|
| 🔑 | Primary Key (UUID) |
| 📧 | Email único |
| 🔒 | Campo encriptado |
| 👤 | Información personal |
| 🎭 | Rol/Tipo de usuario |
| ✅ | Campo booleano |
| 🕐 | Timestamp |
| 🌐 | Dirección IP |
| 🔢 | Campo numérico |
| ⚡ | Acción/Operación |
| 📋 | Nombre de tabla |
| 🎯 | ID de registro objetivo |
| 📊 | Datos JSON |
| 🖥️ | User Agent |
| 👨‍💼 | Información de autor |
| 📖 | Información de libro |
| 🎂 | Fecha de nacimiento |
| 🌍 | Información geográfica |
| 🏢 | Información de empresa |
| 📅 | Fecha |
| 📚 | Género literario |
| 📝 | Texto descriptivo |
| 💰 | Precio/Dinero |
| 📦 | Inventario/Stock |
| 📄 | Número de páginas |
| 🖼️ | URL de imagen |
| 🗑️ | Soft delete (deleted_at) |

## Relaciones

### One-to-Many (1:N)
- **authors** ➔ **books**: Un autor puede escribir múltiples libros
- **publishers** ➔ **books**: Una editorial puede publicar múltiples libros
- **genres** ➔ **books**: Un género puede incluir múltiples libros
- **users** ➔ **audit_logs**: Un usuario puede generar múltiples logs

### Características Especiales

#### 🗑️ Soft Deletes
Tablas con eliminación suave (mantienen `deleted_at`):
- `books`
- `authors` 
- `publishers`
- `genres`

#### 📊 Sistema de Auditoría
- **Tracking completo**: Todos los cambios CRUD se registran
- **Almacenamiento JSONB**: Valores antes/después del cambio
- **Información de contexto**: IP, User-Agent, Usuario, Timestamp

#### 🔐 Autenticación
- **JWT Tokens**: Autenticación stateless
- **Control de acceso**: Roles y permisos
- **Seguridad**: Control de intentos de login y bloqueo temporal

## Enlaces Útiles

- 📋 **[Documentación Completa](./DATABASE.md)**: Descripción detallada del modelo
- 🎨 **[Diagrama Interactivo](https://dbdiagram.io/)**: Usa el archivo `database-schema.dbml`
- 🔗 **[Swagger API](http://localhost:3001/api/docs)**: Documentación de endpoints