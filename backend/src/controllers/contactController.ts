import { Response } from 'express';
import { z } from 'zod';
import { ContactSubmission } from '../models/ContactSubmission.js';
import { AuthRequest } from '../types/index.js';

// Validation schema for contact form submission
const contactSubmissionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim(),
  message: z.string().min(10, 'Message must be at least 10 characters').trim(),
});

/**
 * Submit contact form (public endpoint)
 */
export const submitContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validatedData = contactSubmissionSchema.parse(req.body);
    const { name, email, message } = validatedData;

    // Create new contact submission
    const submission = new ContactSubmission({
      name,
      email,
      message,
    });

    await submission.save();

    res.status(201).json({
      success: true,
      message: 'Thank you for your message! We will get back to you soon.',
      data: {
        id: submission._id,
        createdAt: submission.createdAt,
      },
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact form',
    });
  }
};

/**
 * Get all contact submissions (admin only)
 */
export const getSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;

    // Build search query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count for pagination
    const total = await ContactSubmission.countDocuments(query);

    // Get submissions with pagination
    const submissions = await ContactSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact submissions',
    });
  }
};

