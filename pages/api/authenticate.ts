import { PrismaClient } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

interface ValidationResult {
  is_valid: boolean;
}

type Data = {
  message: string;
  sessionId?: string; 
  error?: string;
};

const limiter = new RateLimiterMemory({
  points: 3, 
  duration: 120, 
  keyPrefix: 'login_fail', 
});

function generateSecureSessionId() {
  return randomBytes(32).toString('hex'); 
}

function generateInsecureSessionId() {
  return `insecure-${Math.floor(Math.random() * 1000000)}`;
}

function setSessionCookie(res: NextApiResponse<Data>, sessionId: string, isVulnerable: boolean) {
  const cookieName = isVulnerable ? 'JSESSIONID' : 'logiNapW';
  let cookieAttributes = `Path=/; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}`;

  if (!isVulnerable) {
    cookieAttributes += `; HttpOnly; Secure`;
  }
  
  res.setHeader('Set-Cookie', `${cookieName}=${sessionId}; ${cookieAttributes}`);
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Pogreška.' });
  }

  const { username, password, isVulnerable } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      if(!isVulnerable) {
        return res.status(401).json({ message: 'Podaci za pristup su pogrešni.', error: 'Podaci za pristup su pogrešn.' });
      }
      return res.status(401).json({ message: 'Pogrešno korisničko ime.', error: 'Pogrešno korisničko ime.' });
    }

    if (!isVulnerable && user.lockUntil && new Date() < user.lockUntil) {
      return res.status(401).json({ message: 'Prijava je blokirana, pokušajte kasnije.', error: 'Prijava je blokirana, pokušajte kasnije.' });
    }

    const result = await prisma.$queryRaw<ValidationResult[]>`SELECT crypt(${password}, ${user.password}) = ${user.password} AS is_valid`;
    const isValidPassword = result[0]?.is_valid;

    if (isValidPassword) {
      const sessionId = isVulnerable ? generateInsecureSessionId() : generateSecureSessionId();
      await prisma.session.create({
        data: {
          userId: user.id, 
          sessionId,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
        },
      });
      setSessionCookie(res, sessionId, isVulnerable);
      await prisma.user.update({
        where: { username },
        data: { failedAttempts: 0, lockUntil: null },
      });
      const responseBody: Data = { message: `Ulogirani ste kao ${username}.` };

      if (isVulnerable) {
        responseBody.sessionId = sessionId; 
      }

      return res.status(200).json(responseBody);
    } else {
      if (!isVulnerable) {
        try {
          await limiter.consume(username);
        } catch (error) {
          const rlRejected = error as RateLimiterRes;
          if (rlRejected instanceof Error) {
            return res.status(500).json({ message: 'Pogreška prilikom prijave.', error: 'Pogreška prilikom prijave.' });
          } else {
            const lockDuration = 180 * 1000; 
            await prisma.user.update({
              where: { username },
              data: { lockUntil: new Date(Date.now() + lockDuration) },
            });
    
            return res.status(429).json({ message: 'Previše pokušaja prijave, pokušajte kasnije.', error: 'Previše pokušaja prijave, pokušajte kasnije.' });
          }
        }
      }

      if (!isVulnerable) {
        await prisma.user.update({
          where: { username },
          data: { failedAttempts: { increment: 1 } },
        });
      }
      if(!isVulnerable) {
        return res.status(401).json({ message: 'Podaci za pristup su pogrešni.', error: 'Podaci za pristup su pogrešni.' });
      }
      return res.status(401).json({ message: 'Pogrešna lozinka.', error: 'Pogrešna lozinka.' });

    }
  } catch (error) {
    return res.status(500).json({ message: 'Pogreška prilikom prijave.', error: 'Pogreška prilikom prijave.' });
  } finally {
    await prisma.$disconnect();
  }
}
