import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanupDatabase() {
  await prisma.codeExecution.deleteMany()
  await prisma.interviewSession.deleteMany()
}

export async function disconnectAll() {
  await prisma.$disconnect()
}

export { prisma }
