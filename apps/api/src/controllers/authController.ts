import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';
import { ENV } from '../config/env';

export class AuthController {
  static async login(req: Request, res: Response) {
    const { email, phone, storeName } = req.body;

    // Quick onboarding / login for Kirana shopkeeper
    let store = await prisma.store.findFirst({
      where: phone ? { phone } : undefined,
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          name: storeName || 'Apna Kirana Store',
          phone: phone || '9876543210',
          currency: 'INR',
        },
      });
    }

    let user = await prisma.user.findFirst({
      where: { storeId: store.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          storeId: store.id,
          name: 'Dukandar Ji',
          email: email || undefined,
          phone: phone || store.phone,
          role: 'OWNER',
        },
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        storeId: store.id,
        role: user.role,
        name: user.name,
      },
      ENV.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      store: {
        id: store.id,
        name: store.name,
        currency: store.currency,
      },
    });
  }

  static async me(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      user: req.user,
      storeId: req.storeId,
    });
  }
}
