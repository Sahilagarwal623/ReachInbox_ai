import { Request, Response } from 'express';
import { prisma } from '../db/client';

export async function loginOrSyncUser(req: Request, res: Response) {
  try {
    const { email, name, avatar, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: name || undefined,
        avatar: avatar || undefined,
        googleId: googleId || undefined,
      },
      create: {
        email,
        name: name || email.split('@')[0],
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
        googleId: googleId || `google-demo-${Date.now()}`,
      },
    });

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    console.error('Error in loginOrSyncUser:', error);
    return res.status(500).json({ error: error.message || 'Authentication error' });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);

    if (!userId) {
      // Return default test demo user
      const defaultUser = await prisma.user.upsert({
        where: { email: 'demo.user@reachinbox.ai' },
        update: {},
        create: {
          email: 'demo.user@reachinbox.ai',
          name: 'Alex Morgan',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
          googleId: 'google-demo-default',
        },
      });
      return res.status(200).json({ user: defaultUser });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
