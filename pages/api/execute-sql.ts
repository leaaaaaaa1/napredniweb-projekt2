import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    const tautologyPattern = /^[a-zA-Z0-9_-]+$/;
  if (req.method === 'POST') {
    const { sql, isVulnerable } = req.body;

    if (typeof sql !== 'string' || typeof isVulnerable !== 'boolean') {
      return res.status(400).json({ error: 'Bad request' });
    }

    try {
        if (isVulnerable) {
            if (!tautologyPattern.test(sql)) {
                const result = await prisma.$queryRawUnsafe(
                    `SELECT * FROM "User" WHERE username = '${sql}'`
                );
                res.status(200).json({ result });
            }
             else {
                const result = await prisma.user.findMany({
                    where: {
                    username: sql,
                    },
                    select: {
                        id: true,
                        username: true,
                        password: false
                    }
                });
                res.status(200).json({ result });
            }
        } else {
            if (!tautologyPattern.test(sql)) {
                const result = "Spriječen SQL injection";
                res.status(200).json({ result });
            } else {
                const result = await prisma.user.findMany({
                    where: {
                        username: sql,
                      },
                    select: {
                        id: true,       
                        username: true, 
                        password: false
                      }
                    });
                    res.status(200).json({ result });
            }
        }
  
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: 'Pokušaj SQL umetanja koji nije tautologija.' });
      } else {
        res.status(500).json({ error: 'Nepoznati error.' });
      }
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
