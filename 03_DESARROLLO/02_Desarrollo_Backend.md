# DESARROLLO DE LA CAPA BACKEND Y API REST
## Proyecto: Sistema Inteligente de Gestión y Análisis Documental
### Institución: Unidades Tecnológicas de Santander (UTS)
### Arquitectura: Clean Architecture en Capas Desacopladas (TypeScript / Node.js / Express o Spring Boot)

---

## 1. ARQUITECTURA DEL BACKEND Y PATRÓN DE DISEÑO

El backend se rige bajo los principios de **Clean Architecture** y el patrón **Controller-Service-Repository**, garantizando alta cohesión y bajo acoplamiento:

```
[Cliente HTTP] ---> [Middlewares (Auth JWT / RBAC / Upload Validator)]
                          |
                          v
                   [Controllers (HTTP Input/Output & Status Codes)]
                          |
                          v
                   [Services (Lógica de Negocio & Orquestación IA)]
                          |
                          v
                   [Repositories (Consultas SQL PostgreSQL / pgvector)]
                          |
                          v
                   [Base de Datos PostgreSQL 16]
```

1. **Capa de Controladores y Rutas (`controllers/`, `routes/`):** Gestionan las peticiones HTTP entrantes, extraen los parámetros, invocan a los servicios correspondientes y devuelven la respuesta estandarizada en formato JSON.
2. **Capa de Servicios de Negocio (`services/`):** Contiene las reglas de negocio, validaciones lógicas, coordinación transaccional y la comunicación HTTP con el microservicio de IA.
3. **Capa de Acceso a Datos / Repositorios (`repositories/`):** Encapsula todas las operaciones de persistencia mediante consultas SQL parametrizadas a PostgreSQL para prevenir inyecciones SQL.
4. **Capa de Middlewares (`middlewares/`):** Filtra y asegura las solicitudes mediante validación de tokens JWT, control de roles (RBAC) y sanitización de archivos.

---

## 2. IMPLEMENTACIÓN DE MÓDULOS NUCLEARES (CÓDIGO FUENTE REAL)

---

### 2.1 Módulo de Seguridad: Autenticación JWT y Guardias RBAC

#### `src/middlewares/auth.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'ANALISTA' | 'CONSULTOR';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Token de autorización ausente o con formato inválido.' },
      timestamp: new Date().toISOString()
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET_KEY || 'default_secret';

  try {
    const decoded = jwt.verify(token, secret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      data: null,
      error: { code: 'INVALID_TOKEN', message: 'El token proporcionado ha expirado o no es válido.' },
      timestamp: new Date().toISOString()
    });
  }
};

export const requireRoles = (allowedRoles: Array<'ADMIN' | 'ANALISTA' | 'CONSULTOR'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        data: null,
        error: { code: 'FORBIDDEN', message: 'No cuenta con los privilegios necesarios para realizar esta acción.' },
        timestamp: new Date().toISOString()
      });
      return;
    }
    next();
  };
};
```

#### `src/services/auth.service.ts`
```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';

export class AuthService {
  private userRepo = new UserRepository();

  async login(email: string, passwordPlain: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user || user.status !== 'ACTIVE') {
      throw new Error('INVALID_CREDENTIALS');
    }

    const passwordMatches = await bcrypt.compare(passwordPlain, user.password_hash);
    if (!passwordMatches) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const secret = process.env.JWT_SECRET_KEY || 'default_secret';
    const expiresIn = parseInt(process.env.JWT_EXPIRATION_SECONDS || '3600', 10);

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, secret, { expiresIn });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET_KEY || 'refresh_secret', { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { id: user.id, email: user.email, role: user.role }
    };
  }
}
```

---

### 2.2 Módulo de Repositorios y Carga Validada de Archivos

#### `src/middlewares/upload.middleware.ts`
```typescript
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request } from 'express';

const UPLOAD_PATH = process.env.UPLOAD_DIR || './uploads/documents';

if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'));
  }
};

export const uploadDocumentMiddleware = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_BYTES || '20971520', 10) // 20 MB
  },
  fileFilter
}).single('file');
```

#### `src/controllers/document.controller.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';

export class DocumentController {
  private docService = new DocumentService();

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: 'FILE_REQUIRED', message: 'Debe adjuntar un archivo para procesar.' }
        });
        return;
      }

      const { folder_id } = req.body;
      const user_id = req.user!.id;

      const document = await this.docService.createAndEnqueueDocument({
        folderId: folder_id,
        userId: user_id,
        originalName: req.file.originalname,
        storedPath: req.file.path,
        fileSize: req.file.size
      });

      res.status(201).json({
        success: true,
        data: {
          document_id: document.id,
          file_name: document.file_name,
          file_type: document.file_type,
          file_size: document.file_size,
          status: document.status,
          message: 'Archivo cargado con éxito. Pipeline de IA encolado.'
        },
        error: null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };
}
```

---

### 2.3 Módulo de Orquestación e Invocación del Microservicio de IA

#### `src/services/ai_client.service.ts`
```typescript
import axios from 'axios';

export interface AIPipelineResult {
  category: 'Administrativo' | 'Financiero' | 'Técnico/Legal';
  confidence_score: number;
  summary: string;
  extracted_data: Record<string, any>;
  chunks_count: number;
}

export class AIClientService {
  private baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  private internalKey = process.env.AI_INTERNAL_API_KEY || 'secret_bridge';

  async triggerDocumentProcessing(documentId: string, filePath: string): Promise<AIPipelineResult> {
    const response = await axios.post<AIPipelineResult>(
      `${this.baseUrl}/internal/v1/process-document`,
      {
        document_id: documentId,
        file_path: filePath
      },
      {
        headers: {
          'X-Internal-Token': this.internalKey,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 segundos de timeout para archivos grandes con OCR
      }
    );

    return response.data;
  }

  async executeRAGQuery(question: string, folderId?: string) {
    const response = await axios.post(
      `${this.baseUrl}/internal/v1/rag/query`,
      { question, folder_id: folderId },
      {
        headers: { 'X-Internal-Token': this.internalKey },
        timeout: 10000
      }
    );
    return response.data;
  }
}
```

---

### 2.4 Módulo de Dashboard y Métricas Consolidadas

#### `src/services/dashboard.service.ts`
```typescript
import { pool } from '../config/database';

export class DashboardService {
  async getMetrics() {
    const client = await pool.connect();
    try {
      // Conteos de estado
      const statusRes = await client.query(`
        SELECT status, COUNT(*)::int as count 
        FROM documents 
        GROUP BY status;
      `);

      // Distribución por categoría de IA
      const categoryRes = await client.query(`
        SELECT category, COUNT(*)::int as count 
        FROM document_analysis 
        GROUP BY category;
      `);

      // Métricas de almacenamiento y totales
      const totalRes = await client.query(`
        SELECT 
          COUNT(*)::int as total_documents,
          COALESCE(SUM(file_size), 0)::bigint as total_bytes
        FROM documents;
      `);

      const statusMap: Record<string, number> = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, ERROR: 0 };
      statusRes.rows.forEach(r => { statusMap[r.status] = r.count; });

      const categoryMap: Record<string, number> = {};
      categoryRes.rows.forEach(r => { categoryMap[r.category] = r.count; });

      const totalDocs = totalRes.rows[0].total_documents;
      const completedDocs = statusMap.COMPLETED || 0;
      const successRate = totalDocs > 0 ? parseFloat(((completedDocs / totalDocs) * 100).toFixed(2)) : 100.0;

      return {
        total_documents: totalDocs,
        total_storage_mb: parseFloat((Number(totalRes.rows[0].total_bytes) / (1024 * 1024)).toFixed(2)),
        status_distribution: statusMap,
        category_distribution: categoryMap,
        success_rate_percentage: successRate
      };
    } finally {
      client.release();
    }
  }
}
```

---

## 3. GESTIÓN GLOBAL DE EXCEPCIONES Y LOGGING

#### `src/middlewares/error.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

export const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Ha ocurrido un error inesperado en el servidor.';

  if (err.message === 'INVALID_FILE_TYPE') {
    statusCode = 400;
    errorCode = 'INVALID_FILE_TYPE';
    message = 'Formato de archivo no admitido. Solo se permiten archivos .pdf, .docx y .txt.';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    errorCode = 'FILE_TOO_LARGE';
    message = 'El archivo supera el límite máximo permitido de 20 MB.';
  } else if (err.message === 'INVALID_CREDENTIALS') {
    statusCode = 401;
    errorCode = 'INVALID_CREDENTIALS';
    message = 'Correo o contraseña incorrectos.';
  }

  // Registro de auditoría del error en base de datos si involucra un documento
  if (req.body?.document_id || req.params?.id) {
    try {
      const docId = req.body?.document_id || req.params?.id;
      await pool.query(
        `INSERT INTO processing_logs (id, document_id, stage, status, error_message, executed_at) 
         VALUES (gen_random_uuid(), $1, 'API_ERROR', 'ERROR', $2, CURRENT_TIMESTAMP)`,
        [docId, `${err.message || 'Error'} | Stack: ${err.stack || ''}`]
      );
    } catch (logErr) {
      console.error('Fallo al persistir log de auditoría:', logErr);
    }
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: errorCode,
      message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    timestamp: new Date().toISOString()
  });
};
```
