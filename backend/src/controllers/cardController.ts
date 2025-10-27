import { Response } from 'express';
import { z } from 'zod';
import { Card } from '../models/Card.js';
import { AuthRequest, UserRole } from '../types/index.js';

// Validation schemas
const createCardSchema = z.object({
  name: z.string().min(1),
  pspLink: z.string().url(),
  commissionPercent: z.number().min(0, 'Commission percent must be at least 0').max(100, 'Commission percent must not exceed 100').default(0),
});

const updateCardSchema = z.object({
  name: z.string().min(1).optional(),
  pspLink: z.string().url().optional(),
  commissionPercent: z.number().min(0, 'Commission percent must be at least 0').max(100, 'Commission percent must not exceed 100').optional(),
  isActive: z.boolean().optional(),
});

export const createCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const validatedData = createCardSchema.parse(req.body);

    const card = await Card.create(validatedData);

    res.status(201).json({ 
      success: true, 
      message: 'Card created successfully',
      data: card 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Create card error:', error);
    res.status(500).json({ success: false, error: 'Failed to create card' });
  }
};

export const listCards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const query: any = {};

    // Non-admin users only see active cards
    if (req.user.role !== UserRole.ADMIN) {
      query.isActive = true;
    }

    const cards = await Card.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: cards,
    });
  } catch (error) {
    console.error('List cards error:', error);
    res.status(500).json({ success: false, error: 'Failed to list cards' });
  }
};

export const getCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const card = await Card.findById(id);

    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }

    // Non-admin users can only see active cards
    if (req.user.role !== UserRole.ADMIN && !card.isActive) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }

    res.json({ success: true, data: card });
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ success: false, error: 'Failed to get card' });
  }
};

export const updateCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const validatedData = updateCardSchema.parse(req.body);

    const card = await Card.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }

    res.json({ 
      success: true, 
      message: 'Card updated successfully',
      data: card 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Update card error:', error);
    res.status(500).json({ success: false, error: 'Failed to update card' });
  }
};

export const deleteCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    // Soft delete by setting isActive to false
    const card = await Card.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }

    res.json({ 
      success: true, 
      message: 'Card deleted successfully',
      data: card 
    });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete card' });
  }
};

