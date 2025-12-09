import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import ioClient from 'socket.io-client'
import request from 'supertest'
import Redis from 'ioredis'
import sessionRoutes from '../routes/sessions.js'
import { setupWebSocket } from '../websocket/handler.js'
import { prisma, redis, cleanupDatabase, disconnectAll } from './setup.js'

type ClientSocket = ReturnType<typeof ioClient>

describe('Coding Interview Platform - Integration Tests', () => {
  let app: express.Application
  let httpServer: ReturnType<typeof createServer>
  let io: Server
  let serverPort: number

  beforeAll(async () => {
    // Create Express app
    app = express()
    app.use(express.json())

    // Create HTTP server
    httpServer = createServer(app)

    // Create Socket.io server
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })

    // Setup routes
    app.use('/api/sessions', sessionRoutes(prisma, redis))

    // Health check
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok' })
    })

    // Setup WebSocket (don't create Redis subscriber in tests)
    const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    setupWebSocket(io, redis, redisSub, prisma)

    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address()
        serverPort = typeof addr === 'object' && addr ? addr.port : 3001
        resolve()
      })
    })

    // Clean database before tests
    await cleanupDatabase()
  })

  afterAll(async () => {
    // Cleanup
    await cleanupDatabase()
    await disconnectAll()

    // Close server
    io.close()
    httpServer.close()
  })

  describe('REST API Tests', () => {
    describe('POST /api/sessions', () => {
      it('should create a new interview session', async () => {
        const response = await request(app)
          .post('/api/sessions')
          .send({ language: 'javascript' })
          .expect(200)

        expect(response.body).toHaveProperty('sessionId')
        expect(response.body).toHaveProperty('url')
        expect(response.body.url).toContain(response.body.sessionId)
      })

      it('should create session with default language if not specified', async () => {
        const response = await request(app)
          .post('/api/sessions')
          .send({})
          .expect(200)

        expect(response.body).toHaveProperty('sessionId')

        // Verify session was created with default language
        const sessionId = response.body.sessionId
        const getResponse = await request(app)
          .get(`/api/sessions/${sessionId}`)
          .expect(200)

        expect(getResponse.body.language).toBe('javascript')
      })
    })

    describe('GET /api/sessions/:id', () => {
      it('should retrieve an existing session', async () => {
        // Create a session first
        const createResponse = await request(app)
          .post('/api/sessions')
          .send({ language: 'python' })

        const sessionId = createResponse.body.sessionId

        // Retrieve the session
        const response = await request(app)
          .get(`/api/sessions/${sessionId}`)
          .expect(200)

        expect(response.body).toHaveProperty('id', sessionId)
        expect(response.body).toHaveProperty('language', 'python')
        expect(response.body).toHaveProperty('createdAt')
        expect(response.body).toHaveProperty('expiresAt')
      })

      it('should return 404 for non-existent session', async () => {
        const response = await request(app)
          .get('/api/sessions/non-existent-id')
          .expect(404)

        expect(response.body).toHaveProperty('error', 'Session not found')
      })
    })

    describe('POST /api/sessions/:id/execute', () => {
      let sessionId: string

      beforeEach(async () => {
        // Create a session for execution tests
        const createResponse = await request(app)
          .post('/api/sessions')
          .send({ language: 'javascript' })
        sessionId = createResponse.body.sessionId
      })

      it('should execute JavaScript code successfully', async () => {
        const code = 'console.log("Hello, World!")'

        const response = await request(app)
          .post(`/api/sessions/${sessionId}/execute`)
          .send({ code, language: 'javascript' })
          .expect(200)

        expect(response.body).toHaveProperty('output')
        expect(response.body.output).toContain('Hello, World!')
        expect(response.body).toHaveProperty('executionTime')
        expect(typeof response.body.executionTime).toBe('number')
      }, 30000)

      it('should execute Python code successfully', async () => {
        const code = 'print("Hello from Python")'

        const response = await request(app)
          .post(`/api/sessions/${sessionId}/execute`)
          .send({ code, language: 'python' })
          .expect(200)

        expect(response.body).toHaveProperty('output')
        expect(response.body.output).toContain('Hello from Python')
        expect(response.body).toHaveProperty('executionTime')
      }, 30000)

      it('should return error for code with syntax errors', async () => {
        const code = 'console.log("unclosed string'

        const response = await request(app)
          .post(`/api/sessions/${sessionId}/execute`)
          .send({ code, language: 'javascript' })

        // Should either return 400 (validation error) or 200 with error in result
        if (response.status === 400) {
          expect(response.body).toHaveProperty('error')
        } else {
          expect(response.status).toBe(200)
          expect(response.body).toHaveProperty('error')
        }
      }, 30000)

      it('should return 400 if code is missing', async () => {
        const response = await request(app)
          .post(`/api/sessions/${sessionId}/execute`)
          .send({ language: 'javascript' })
          .expect(400)

        expect(response.body).toHaveProperty('error')
      })

      it('should return 400 if language is missing', async () => {
        const response = await request(app)
          .post(`/api/sessions/${sessionId}/execute`)
          .send({ code: 'console.log("test")' })
          .expect(400)

        expect(response.body).toHaveProperty('error')
      })

      it('should return 404 for non-existent session', async () => {
        const response = await request(app)
          .post('/api/sessions/fake-session-id/execute')
          .send({ code: 'console.log("test")', language: 'javascript' })
          .expect(404)

        expect(response.body).toHaveProperty('error', 'Session not found')
      })

      it('should save execution history to database', async () => {
        const code = 'console.log("test execution history")'

        await request(app)
          .post(`/api/sessions/${sessionId}/execute`)
          .send({ code, language: 'javascript' })
          .expect(200)

        // Verify execution was saved
        const executions = await prisma.codeExecution.findMany({
          where: { sessionId }
        })

        expect(executions.length).toBeGreaterThan(0)
        const execution = executions[executions.length - 1]
        expect(execution.code).toBe(code)
        expect(execution.language).toBe('javascript')
        expect(execution.output).toBeTruthy()
      }, 30000)
    })

    describe('GET /health', () => {
      it('should return health status', async () => {
        const response = await request(app)
          .get('/health')
          .expect(200)

        expect(response.body).toEqual({ status: 'ok' })
      })
    })
  })

  describe('WebSocket Tests', () => {
    let clientSocket: ClientSocket

    afterEach(() => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect()
      }
    })

    it('should establish WebSocket connection', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`)

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true)
        done()
      })

      clientSocket.on('connect_error', (error: Error) => {
        done(error)
      })
    })

    it('should allow user to join a session', (done) => {
      // Create a session first
      request(app)
        .post('/api/sessions')
        .send({ language: 'javascript' })
        .then((createResponse) => {
          const sessionId = createResponse.body.sessionId

          clientSocket = ioClient(`http://localhost:${serverPort}`)

          clientSocket.on('connect', () => {
            clientSocket.emit('join-session', sessionId, 'Test User')
          })

          clientSocket.on('session-state', (data: any) => {
            expect(data).toHaveProperty('id', sessionId)
            expect(data).toHaveProperty('language')
            done()
          })

          setTimeout(() => {
            if (!clientSocket.disconnected) {
              done(new Error('Timeout waiting for session-state event'))
            }
          }, 5000)
        })
        .catch(done)
    })

    it('should broadcast user join to other connected users', (done) => {
      // Create a session
      request(app)
        .post('/api/sessions')
        .send({ language: 'javascript' })
        .then((createResponse) => {
          const sessionId = createResponse.body.sessionId

          // First client joins
          const client1 = ioClient(`http://localhost:${serverPort}`)

          client1.on('connect', () => {
            client1.emit('join-session', sessionId, 'User 1')
          })

          client1.on('session-state', () => {
            // Second client joins after first one is connected
            const client2 = ioClient(`http://localhost:${serverPort}`)

            client2.on('connect', () => {
              client2.emit('join-session', sessionId, 'User 2')
            })

            // First client should receive user-joined event
            client1.on('user-joined', (data: any) => {
              expect(data).toHaveProperty('username', 'User 2')
              client1.disconnect()
              client2.disconnect()
              done()
            })
          })

          setTimeout(() => {
            client1.disconnect()
            done(new Error('Timeout waiting for user-joined event'))
          }, 5000)
        })
        .catch(done)
    })

    it('should handle language change events', (done) => {
      // Create a session
      request(app)
        .post('/api/sessions')
        .send({ language: 'javascript' })
        .then((createResponse) => {
          const sessionId = createResponse.body.sessionId

          clientSocket = ioClient(`http://localhost:${serverPort}`)

          clientSocket.on('connect', () => {
            clientSocket.emit('join-session', sessionId, 'Test User')
          })

          let sessionStateReceived = false
          clientSocket.on('session-state', () => {
            if (!sessionStateReceived) {
              sessionStateReceived = true
              // Change language
              clientSocket.emit('language-change', {
                sessionId,
                language: 'python'
              })
            }
          })

          clientSocket.on('language-changed', (data: any) => {
            expect(data).toHaveProperty('language', 'python')
            done()
          })

          setTimeout(() => {
            done(new Error('Timeout waiting for language-changed event'))
          }, 5000)
        })
        .catch(done)
    })
  })

  describe('Client-Server Integration', () => {
    it('should handle complete workflow: create session -> join -> execute code', async () => {
      // 1. Create session via REST API
      const createResponse = await request(app)
        .post('/api/sessions')
        .send({ language: 'javascript' })
        .expect(200)

      const sessionId = createResponse.body.sessionId

      // 2. Connect via WebSocket
      const client = ioClient(`http://localhost:${serverPort}`)

      await new Promise<void>((resolve, reject) => {
        client.on('connect', () => {
          client.emit('join-session', sessionId, 'Integration Test User')
        })

        client.on('session-state', (data: any) => {
          expect(data.id).toBe(sessionId)
          resolve()
        })

        client.on('connect_error', (error: Error) => reject(error))

        setTimeout(() => reject(new Error('Timeout')), 5000)
      })

      // 3. Execute code via REST API
      const code = 'console.log("Integration test successful")'
      const executeResponse = await request(app)
        .post(`/api/sessions/${sessionId}/execute`)
        .send({ code, language: 'javascript' })
        .expect(200)

      expect(executeResponse.body.output).toContain('Integration test successful')

      // 4. Verify session still exists
      const getResponse = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200)

      expect(getResponse.body.id).toBe(sessionId)

      client.disconnect()
    }, 30000)
  })
})
