import { Response } from 'express';
import { z } from 'zod';
import { Settings } from '../models/Settings.js';
import { AuthRequest, UserRole } from '../types/index.js';

const updateSettingSchema = z.object({
  value: z.any(),
});

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { category } = req.query;
    const query: any = {};
    
    if (category) {
      query.category = category;
    }

    const settings = await Settings.find(query).sort({ category: 1, key: 1 });

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
};

export const updateSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || ![UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { key } = req.params;
    const validatedData = updateSettingSchema.parse(req.body);

    let setting = await Settings.findOne({ key });

    if (!setting) {
      // Create new setting
      setting = await Settings.create({
        key,
        value: validatedData.value,
        category: req.body.category || 'general',
        description: req.body.description,
        isEncrypted: req.body.isEncrypted || false,
        merchantId: req.user?.merchantId,
      });
    } else {
      // Update existing setting
      setting.value = validatedData.value;
      if (req.body.category) setting.category = req.body.category;
      if (req.body.description) setting.description = req.body.description;
      if (typeof req.body.isEncrypted === 'boolean') setting.isEncrypted = req.body.isEncrypted;
      await setting.save();
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, error: 'Failed to update setting' });
  }
};

export const deleteSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || ![UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { key } = req.params;

    const setting = await Settings.findOneAndDelete({ key });

    if (!setting) {
      res.status(404).json({ success: false, error: 'Setting not found' });
      return;
    }

    res.json({ success: true, message: 'Setting deleted' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete setting' });
  }
};

