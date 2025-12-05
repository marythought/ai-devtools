# Online Coding Interview Platform - Implementation Plan

## Project Overview
A real-time collaborative coding platform for conducting technical interviews with live code execution.

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Real-time**: Yjs + y-websocket + y-monaco
- **State Management**: Zustand or React Context
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **WebSocket Client**: Socket.io-client

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **WebSocket**: Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Pub-Sub**: Redis
- **Code Execution**: Docker containers with resource limits
- **Authentication**: JWT (optional for future)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Deployment**: AWS/Railway/Render
- **CI/CD**: GitHub Actions

---

## Phase 1: Project Setup & Structure

### Step 1.1: Initialize Monorepo
```bash
mkdir coding-interview-platform
cd coding-interview-platform

# Initialize monorepo structure
mkdir -p packages/frontend packages/backend
npm init -y
```

### Step 1.2: Package Structure
```
coding-interview-platform/
├── packages/
│   ├── frontend/          # React app
│   ├── backend/           # Express API + WebSocket server
│   └── shared/            # Shared types and utilities
├── docker-compose.yml     # Local development services
├── package.json           # Root package.json
└── .github/workflows/     # CI/CD pipelines
```

### Step 1.3: Setup Frontend
```bash
cd packages/frontend
npm create vite@latest . -- --template react-ts
npm install @monaco-editor/react yjs y-websocket y-monaco socket.io-client
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 1.4: Setup Backend
```bash
cd packages/backend
npm init -y
npm install express socket.io redis ioredis prisma @prisma/client
npm install -D typescript @types/express @types/node ts-node-dev
npx tsc --init
npx prisma init
```

### Step 1.5: Setup Shared Package
```bash
cd packages/shared
npm init -y
npm install -D typescript
# Create shared types for interview sessions, messages, etc.
```

---

## Phase 2: Backend Implementation

### Step 2.1: Database Schema Design

**Prisma Schema** (`packages/backend/prisma/schema.prisma`):
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model InterviewSession {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  expiresAt     DateTime?
  language      String   @default("javascript")
  code          String   @default("")

  snapshots     CodeSnapshot[]
  executions    CodeExecution[]
}

model CodeSnapshot {
  id          String   @id @default(cuid())
  sessionId   String
  code        String
  language    String
  createdAt   DateTime @default(now())

  session     InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
}

model CodeExecution {
  id          String   @id @default(cuid())
  sessionId   String
  code        String
  language    String
  output      String?
  error       String?
  executedAt  DateTime @default(now())

  session     InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
}
```

### Step 2.2: Express Server Setup

**Main Server** (`packages/backend/src/index.ts`):
```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' }
});

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.use(express.json());

// REST API routes
app.post('/api/sessions', async (req, res) => {
  const { language = 'javascript' } = req.body;
  const session = await prisma.interviewSession.create({
    data: { language }
  });
  res.json({ sessionId: session.id, url: `${process.env.FRONTEND_URL}/session/${session.id}` });
});

app.get('/api/sessions/:id', async (req, res) => {
  const session = await prisma.interviewSession.findUnique({
    where: { id: req.params.id }
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// WebSocket handling (will be implemented in next step)

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 2.3: WebSocket Implementation

**WebSocket Handler** (`packages/backend/src/websocket.ts`):
```typescript
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';

export function setupWebSocket(io: Server, redis: Redis, redisSub: Redis, prisma: PrismaClient) {

  // Subscribe to Redis pub/sub for multi-instance support
  redisSub.subscribe('code-changes');
  redisSub.on('message', (channel, message) => {
    if (channel === 'code-changes') {
      const { sessionId, data } = JSON.parse(message);
      io.to(sessionId).emit('code-change', data);
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-session', async (sessionId: string, username?: string) => {
      socket.join(sessionId);

      // Store user info in Redis
      await redis.hset(`session:${sessionId}:users`, socket.id, JSON.stringify({
        id: socket.id,
        username: username || `User-${socket.id.slice(0, 4)}`,
        joinedAt: Date.now()
      }));

      // Get all users in session
      const users = await redis.hgetall(`session:${sessionId}:users`);
      const userList = Object.values(users).map(u => JSON.parse(u));

      // Notify all users
      io.to(sessionId).emit('user-joined', { userId: socket.id, username, users: userList });

      // Send current session state to joining user
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId }
      });
      socket.emit('session-state', session);
    });

    socket.on('cursor-change', async (data) => {
      const { sessionId, position, selection } = data;
      socket.to(sessionId).emit('remote-cursor', {
        userId: socket.id,
        position,
        selection
      });
    });

    socket.on('language-change', async (data) => {
      const { sessionId, language } = data;
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: { language }
      });
      io.to(sessionId).emit('language-changed', { language });
    });

    socket.on('disconnect', async () => {
      // Find all rooms user was in
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);

      for (const sessionId of rooms) {
        await redis.hdel(`session:${sessionId}:users`, socket.id);
        const users = await redis.hgetall(`session:${sessionId}:users`);
        const userList = Object.values(users).map(u => JSON.parse(u));

        io.to(sessionId).emit('user-left', { userId: socket.id, users: userList });
      }
    });
  });
}
```

### Step 2.4: Code Execution Service

**Docker-based Execution** (`packages/backend/src/execution.ts`):
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

interface ExecutionResult {
  output?: string;
  error?: string;
  executionTime: number;
}

const LANGUAGE_CONFIGS = {
  javascript: {
    image: 'node:20-alpine',
    command: (file: string) => `node ${file}`,
    extension: 'js'
  },
  python: {
    image: 'python:3.11-alpine',
    command: (file: string) => `python ${file}`,
    extension: 'py'
  },
  typescript: {
    image: 'node:20-alpine',
    command: (file: string) => `npx ts-node ${file}`,
    extension: 'ts'
  }
};

export async function executeCode(code: string, language: string): Promise<ExecutionResult> {
  const config = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const executionId = randomUUID();
  const filename = `code_${executionId}.${config.extension}`;
  const filepath = join('/tmp', filename);

  const startTime = Date.now();

  try {
    // Write code to temp file
    await writeFile(filepath, code);

    // Execute in Docker container with resource limits
    const dockerCommand = `docker run --rm \
      --memory=128m \
      --cpus=0.5 \
      --network=none \
      --read-only \
      -v ${filepath}:/code/${filename}:ro \
      ${config.image} \
      timeout 5s ${config.command(`/code/${filename}`)}`;

    const { stdout, stderr } = await execAsync(dockerCommand, {
      timeout: 10000 // 10 second timeout including Docker overhead
    });

    const executionTime = Date.now() - startTime;

    return {
      output: stdout,
      error: stderr || undefined,
      executionTime
    };

  } catch (error: any) {
    const executionTime = Date.now() - startTime;

    return {
      error: error.message || 'Execution failed',
      executionTime
    };
  } finally {
    // Clean up temp file
    try {
      await unlink(filepath);
    } catch (e) {
      console.error('Failed to cleanup temp file:', e);
    }
  }
}
```

**Add execution endpoint** to Express server:
```typescript
app.post('/api/sessions/:id/execute', async (req, res) => {
  const { code, language } = req.body;
  const sessionId = req.params.id;

  try {
    const result = await executeCode(code, language);

    // Save execution record
    await prisma.codeExecution.create({
      data: {
        sessionId,
        code,
        language,
        output: result.output,
        error: result.error
      }
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Phase 3: Frontend Implementation

### Step 3.1: Project Structure
```
packages/frontend/src/
├── components/
│   ├── Editor/
│   │   ├── MonacoEditor.tsx
│   │   ├── LanguageSelector.tsx
│   │   └── ExecutionPanel.tsx
│   ├── Session/
│   │   ├── SessionView.tsx
│   │   ├── UserPresence.tsx
│   │   └── ShareLink.tsx
│   └── Home/
│       └── CreateSession.tsx
├── hooks/
│   ├── useWebSocket.ts
│   ├── useYjs.ts
│   └── useSession.ts
├── services/
│   ├── api.ts
│   └── websocket.ts
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

### Step 3.2: Monaco Editor Component

**Monaco Editor Wrapper** (`packages/frontend/src/components/Editor/MonacoEditor.tsx`):
```typescript
import { useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';

interface MonacoEditorProps {
  sessionId: string;
  language: string;
  onLanguageChange: (language: string) => void;
}

export default function MonacoEditor({ sessionId, language, onLanguageChange }: MonacoEditorProps) {
  const editorRef = useRef<any>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Initialize Yjs
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('monaco');

    // Connect to WebSocket provider for Yjs
    const provider = new WebsocketProvider(
      'ws://localhost:3001', // Yjs WebSocket server
      sessionId,
      ydoc
    );

    providerRef.current = provider;

    // Bind Monaco editor to Yjs
    const binding = new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );

    bindingRef.current = binding;

    return () => {
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [sessionId]);

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    editorRef.current = editor;

    // Add custom keybindings or configurations
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      // Trigger code execution
      const code = editor.getValue();
      console.log('Execute:', code);
    });
  }

  return (
    <div className="h-full">
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
```

### Step 3.3: WebSocket Hook

**WebSocket Hook** (`packages/frontend/src/hooks/useWebSocket.ts`):
```typescript
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  username: string;
  joinedAt: number;
}

export function useWebSocket(sessionId: string, username?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-session', sessionId, username);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('user-joined', ({ users: updatedUsers }: { users: User[] }) => {
      setUsers(updatedUsers);
    });

    socket.on('user-left', ({ users: updatedUsers }: { users: User[] }) => {
      setUsers(updatedUsers);
    });

    socket.on('language-changed', ({ language }: { language: string }) => {
      // Handle language change
      console.log('Language changed to:', language);
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, username]);

  return {
    socket: socketRef.current,
    isConnected,
    users
  };
}
```

### Step 3.4: Session View Component

**Session View** (`packages/frontend/src/components/Session/SessionView.tsx`):
```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MonacoEditor from '../Editor/MonacoEditor';
import LanguageSelector from '../Editor/LanguageSelector';
import ExecutionPanel from '../Editor/ExecutionPanel';
import UserPresence from './UserPresence';
import ShareLink from './ShareLink';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getSession } from '../../services/api';

export default function SessionView() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [language, setLanguage] = useState('javascript');
  const [executionResult, setExecutionResult] = useState<any>(null);

  const { socket, isConnected, users } = useWebSocket(sessionId!, 'Anonymous');

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;
      const session = await getSession(sessionId);
      setLanguage(session.language);
    }
    loadSession();
  }, [sessionId]);

  function handleLanguageChange(newLanguage: string) {
    setLanguage(newLanguage);
    socket?.emit('language-change', { sessionId, language: newLanguage });
  }

  async function handleExecute(code: string) {
    const response = await fetch(`http://localhost:3001/api/sessions/${sessionId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language })
    });
    const result = await response.json();
    setExecutionResult(result);
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Coding Interview</h1>
        <div className="flex items-center gap-4">
          <LanguageSelector value={language} onChange={handleLanguageChange} />
          <UserPresence users={users} isConnected={isConnected} />
          <ShareLink sessionId={sessionId!} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <MonacoEditor
            sessionId={sessionId!}
            language={language}
            onLanguageChange={handleLanguageChange}
          />
        </div>

        <div className="w-96 border-l border-gray-700">
          <ExecutionPanel
            result={executionResult}
            onExecute={handleExecute}
          />
        </div>
      </div>
    </div>
  );
}
```

### Step 3.5: API Service

**API Client** (`packages/frontend/src/services/api.ts`):
```typescript
const API_BASE = 'http://localhost:3001/api';

export async function createSession(language = 'javascript') {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language })
  });
  return response.json();
}

export async function getSession(sessionId: string) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}`);
  return response.json();
}

export async function executeCode(sessionId: string, code: string, language: string) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language })
  });
  return response.json();
}
```

---

## Phase 4: Advanced Features

### Step 4.1: User Presence & Cursors

Implement cursor tracking using Yjs awareness:
```typescript
// In MonacoEditor component
provider.awareness.setLocalStateField('user', {
  name: username,
  color: generateUserColor(userId)
});

provider.awareness.on('change', () => {
  const states = provider.awareness.getStates();
  // Render remote cursors
});
```

### Step 4.2: Auto-save & History

Add periodic snapshots:
```typescript
// Backend: Auto-save every 30 seconds
setInterval(async () => {
  const sessions = await redis.keys('session:*:code');
  for (const key of sessions) {
    const sessionId = key.split(':')[1];
    const code = await redis.get(key);

    await prisma.codeSnapshot.create({
      data: { sessionId, code, language: 'javascript' }
    });
  }
}, 30000);
```

### Step 4.3: Session Expiration

Add TTL to sessions:
```typescript
await prisma.interviewSession.create({
  data: {
    language,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  }
});
```

---

## Phase 5: Deployment

### Step 5.1: Docker Setup

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: interview_platform
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./packages/backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://admin:password@postgres:5432/interview_platform
      REDIS_URL: redis://redis:6379
      FRONTEND_URL: http://localhost:5173
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./packages/frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3001
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### Step 5.2: Production Deployment

**Options**:
1. **Railway**: Easy deployment with database included
2. **Render**: Free tier for PostgreSQL + web services
3. **AWS**: ECS + RDS + ElastiCache for scalability
4. **Vercel (Frontend) + Railway (Backend)**: Hybrid approach

---

## Phase 6: Testing

### Step 6.1: Backend Tests
```typescript
// Use Jest + Supertest
describe('Session API', () => {
  it('should create a new session', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .send({ language: 'javascript' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sessionId');
  });
});
```

### Step 6.2: Frontend Tests
```typescript
// Use Vitest + Testing Library
import { render, screen } from '@testing-library/react';
import SessionView from './SessionView';

test('renders session view', () => {
  render(<SessionView />);
  expect(screen.getByText('Coding Interview')).toBeInTheDocument();
});
```

### Step 6.3: E2E Tests
```typescript
// Use Playwright
test('collaborative editing works', async ({ page, context }) => {
  // Open session in two tabs
  const page1 = page;
  const page2 = await context.newPage();

  await page1.goto('/session/test-id');
  await page2.goto('/session/test-id');

  // Type in page1
  await page1.type('.monaco-editor', 'console.log("test")');

  // Verify it appears in page2
  await expect(page2.locator('.monaco-editor')).toContainText('console.log("test")');
});
```

---

## Implementation Timeline

### Week 1: Foundation
- Project setup & infrastructure
- Database schema & migrations
- Basic Express API + WebSocket server

### Week 2: Core Features
- Monaco Editor integration
- Yjs real-time collaboration
- Basic code execution

### Week 3: Polish
- User presence & cursors
- UI/UX improvements
- Session management

### Week 4: Production
- Testing
- Deployment setup
- Documentation

---

## Security Considerations

1. **Code Execution Sandbox**: Use Docker with strict resource limits
2. **Rate Limiting**: Prevent abuse of execution API
3. **Input Validation**: Sanitize all user inputs
4. **Session Expiration**: Auto-delete old sessions
5. **CORS**: Configure properly for production
6. **No Authentication Initially**: Add JWT/OAuth later if needed

---

## Performance Optimization

1. **Redis Caching**: Cache session data, user presence
2. **WebSocket Scaling**: Use Redis pub/sub for horizontal scaling
3. **CDN**: Serve static assets via CDN
4. **Code Splitting**: Lazy load Monaco Editor
5. **Database Indexing**: Index sessionId fields

---

## Future Enhancements

- [ ] Video/audio chat integration
- [ ] Session recording & playback
- [ ] Code review/commenting features
- [ ] Multi-file support
- [ ] Git integration
- [ ] AI-powered code suggestions
- [ ] Custom test case runner
- [ ] Interviewer/candidate role separation
- [ ] Session templates

---

## Resources & References

- Monaco Editor: https://microsoft.github.io/monaco-editor/
- Yjs Documentation: https://docs.yjs.dev/
- Socket.io Guide: https://socket.io/docs/v4/
- Prisma ORM: https://www.prisma.io/docs/
- Docker Security: https://docs.docker.com/engine/security/

---

## Next Steps

Ready to start implementing? Here's what to do:

1. Run `mkdir coding-interview-platform && cd coding-interview-platform`
2. Follow Phase 1 to set up the project structure
3. Set up Docker Compose for local development
4. Start with backend API implementation
5. Build frontend incrementally

Would you like me to help you start with any specific phase?
