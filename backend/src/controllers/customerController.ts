import { Response } from 'express';
import { z } from 'zod';
import { Customer } from '../models/Customer.js';
import { PaymentRequest } from '../models/PaymentRequest.js';
import { AuthRequest, UserRole } from '../types/index.js';

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  country: z.string().optional(),
  riskFlags: z.array(z.string()).optional(),
});

const addNoteSchema = z.object({
  text: z.string(),
});

export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const validatedData = createCustomerSchema.parse(req.body);

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      userId: req.user.id,
      email: validatedData.email,
    });

    if (existingCustomer) {
      res.status(400).json({ 
        success: false, 
        error: 'Customer with this email already exists' 
      });
      return;
    }

    const customer = await Customer.create({
      userId: req.user.id,
      ...validatedData,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
};

export const listCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { search, riskFlag, page = 1, limit = 10 } = req.query;
    let query: any = {};

    // For merchants, only show their own customers
    if (req.user.role === UserRole.MERCHANT) {
      query.userId = req.user.id;
    } else if (req.query.merchantId) {
      // For ops/admin, allow filtering by merchantId (userId)
      query.userId = req.query.merchantId;
    }

    // Apply filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (riskFlag) {
      query.riskFlags = riskFlag;
    }

    const customers = await Customer.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ totalVolume: -1, createdAt: -1 });

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ success: false, error: 'Failed to list customers' });
  }
};

export const getCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const customer = await Customer.findById(id).populate('notes.createdBy', 'email');

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    // Check authorization
    if (req.user.role === UserRole.MERCHANT) {
      if (customer.userId.toString() !== req.user.id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
    }

    // Get customer payment requests
    const paymentRequests = await PaymentRequest.find({
      'customerInfo.email': customer.email,
      userId: customer.userId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id amount currency status createdAt paidAt');

    res.json({ 
      success: true, 
      data: {
        customer,
        paymentRequests,
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to get customer' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const { riskFlags, phone, country } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    // Check ownership
    if (customer.userId.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Update allowed fields
    if (riskFlags !== undefined) customer.riskFlags = riskFlags;
    if (phone !== undefined) customer.phone = phone;
    if (country !== undefined) customer.country = country;

    await customer.save();

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
};

export const addCustomerNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const validatedData = addNoteSchema.parse(req.body);

    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    // Check authorization
    if (req.user.role === UserRole.MERCHANT) {
      if (customer.userId.toString() !== req.user.id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
    }

    customer.notes.push({
      text: validatedData.text,
      createdBy: req.user.id as any,
      createdAt: new Date(),
    });

    await customer.save();

    res.json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Add customer note error:', error);
    res.status(500).json({ success: false, error: 'Failed to add note' });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    // Check ownership
    if (customer.userId.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    await customer.deleteOne();

    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete customer' });
  }
};

