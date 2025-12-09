import { Router } from 'express'
import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'
import { executeCode, validateCode } from '../services/execution.js'

export default function sessionRoutes(prisma: PrismaClient, _redis: Redis) {
  const router = Router()

  // Create new session
  router.post('/', async (req, res) => {
    try {
      const { language = 'javascript' } = req.body

      const session = await prisma.interviewSession.create({
        data: {
          language,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      })

      res.json({
        sessionId: session.id,
        url: `${process.env.FRONTEND_URL}/session/${session.id}`
      })
    } catch (error) {
      console.error('Error creating session:', error)
      res.status(500).json({ error: 'Failed to create session' })
    }
  })

  // Get session by ID
  router.get('/:id', async (req, res) => {
    try {
      const session = await prisma.interviewSession.findUnique({
        where: { id: req.params.id }
      })

      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      // Check if session expired
      if (session.expiresAt && session.expiresAt < new Date()) {
        return res.status(410).json({ error: 'Session expired' })
      }

      res.json(session)
    } catch (error) {
      console.error('Error fetching session:', error)
      res.status(500).json({ error: 'Failed to fetch session' })
    }
  })

  // Execute code
  router.post('/:id/execute', async (req, res) => {
    try {
      const { code, language } = req.body
      const sessionId = req.params.id

      // Validate inputs
      if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' })
      }

      // Validate session exists
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId }
      })

      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      // Validate code
      const validation = validateCode(code, language)
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error })
      }

      console.log(`Executing ${language} code for session ${sessionId}`)

      // Execute code in Docker container
      const result = await executeCode(code, language)

      // Save execution record
      await prisma.codeExecution.create({
        data: {
          sessionId,
          code,
          language,
          output: result.output || null,
          error: result.error || null
        }
      })

      console.log(`Execution completed in ${result.executionTime}ms`)

      res.json(result)
    } catch (error: any) {
      console.error('Error executing code:', error)
      res.status(500).json({
        error: error.message || 'Failed to execute code',
        executionTime: 0
      })
    }
  })

  return router
}
