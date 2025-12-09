import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export async function cleanupDatabase() {
  await prisma.codeExecution.deleteMany()
  await prisma.interviewSession.deleteMany()
}

export async function disconnectAll() {
  await prisma.$disconnect()
  await redis.quit()
}

export { prisma, redis }
