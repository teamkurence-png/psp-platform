import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest, UserRole } from '../types/index.js';
import { createApiKeySchema } from '../types/api.js';
import { apiKeyService } from '../services/apiKeyService.js';

/**
 * @swagger
 * /api/api-keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: User-friendly name for the API key
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date
 *     responses:
 *       201:
 *         description: API key created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only merchants can create API keys
 */
export const createApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({
        success: false,
        error: 'Only merchant accounts can create API keys',
      });
      return;
    }

    const validatedData = createApiKeySchema.parse(req.body);

    const apiKey = await apiKeyService.createKey(
      req.user.id,
      validatedData.name,
      validatedData.expiresAt
    );

    res.status(201).json({
      success: true,
      data: apiKey,
      message: 'API key created successfully. Save it securely - it will not be shown again.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Create API key error:', error);
    res.status(500).json({ success: false, error: 'Failed to create API key' });
  }
};

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: List all API keys for the authenticated merchant
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *       401:
 *         description: Unauthorized
 */
export const listApiKeys = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const apiKeys = await apiKeyService.listKeys(req.user.id);

    res.json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({ success: false, error: 'Failed to list API keys' });
  }
};

/**
 * @swagger
 * /api/api-keys/{id}:
 *   get:
 *     summary: Get details of a specific API key
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key details
 *       404:
 *         description: API key not found
 */
export const getApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const apiKey = await apiKeyService.getKey(id, req.user.id);

    if (!apiKey) {
      res.status(404).json({ success: false, error: 'API key not found' });
      return;
    }

    res.json({
      success: true,
      data: apiKey,
    });
  } catch (error) {
    console.error('Get API key error:', error);
    res.status(500).json({ success: false, error: 'Failed to get API key' });
  }
};

/**
 * @swagger
 * /api/api-keys/{id}:
 *   delete:
 *     summary: Revoke (deactivate) an API key
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *       404:
 *         description: API key not found
 */
export const revokeApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const revoked = await apiKeyService.revokeKey(id, req.user.id);

    if (!revoked) {
      res.status(404).json({ success: false, error: 'API key not found' });
      return;
    }

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke API key' });
  }
};

