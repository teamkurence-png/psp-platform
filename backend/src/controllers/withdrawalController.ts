import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Withdrawal } from '../models/Withdrawal.js';
import { Balance } from '../models/Balance.js';
import { AuthRequest, UserRole, CryptoAsset, WithdrawalStatus } from '../types/index.js';

// Validation schema
const createWithdrawalSchema = z.object({
  method: z.enum(['crypto', 'bank_transfer']),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  
  // Crypto fields
  asset: z.enum([CryptoAsset.USDT_TRC20, CryptoAsset.USDT_ERC20, CryptoAsset.BTC, CryptoAsset.ETH]).optional(),
  network: z.string().optional(),
  address: z.string().optional(),
  
  // Bank transfer fields
  bankAccount: z.string().optional(),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  bankName: z.string().optional(),
  beneficiaryName: z.string().optional(),
  
  // Optional transaction linking
  transactionIds: z.array(z.string()).optional(),
});

// Crypto address validation patterns
const addressPatterns: Record<string, RegExp> = {
  BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  ETH: /^0x[a-fA-F0-9]{40}$/,
  TRC20: /^T[a-zA-Z0-9]{33}$/,
};

const validateCryptoAddress = (asset: CryptoAsset, address: string): boolean => {
  if (asset === CryptoAsset.BTC) {
    return addressPatterns.BTC.test(address);
  } else if (asset === CryptoAsset.ETH || asset === CryptoAsset.USDT_ERC20) {
    return addressPatterns.ETH.test(address);
  } else if (asset === CryptoAsset.USDT_TRC20) {
    return addressPatterns.TRC20.test(address);
  }
  return false;
};

const calculateWithdrawalFee = (asset: CryptoAsset, amount: number): number => {
  // Simplified fee calculation
  const feeRates: Record<CryptoAsset, number> = {
    [CryptoAsset.USDT_TRC20]: 1, // Flat fee
    [CryptoAsset.USDT_ERC20]: 5, // Higher gas fees
    [CryptoAsset.BTC]: 0.0001 * amount, // 0.01% of amount
    [CryptoAsset.ETH]: 0.001 * amount, // 0.1% of amount
  };
  return feeRates[asset] || 1;
};

export const createWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== UserRole.MERCHANT) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const validatedData = createWithdrawalSchema.parse(req.body);

    // Validate based on method
    if (validatedData.method === 'crypto') {
      // Crypto validation
      if (!validatedData.asset || !validatedData.address) {
        res.status(400).json({ 
          success: false, 
          error: 'Asset and address are required for crypto withdrawals' 
        });
        return;
      }

      if (!validateCryptoAddress(validatedData.asset, validatedData.address)) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid crypto address format' 
        });
        return;
      }
    } else if (validatedData.method === 'bank_transfer') {
      // Bank transfer validation - at least one bank identifier required
      if (!validatedData.iban && !validatedData.accountNumber && !validatedData.bankAccount) {
        res.status(400).json({ 
          success: false, 
          error: 'Bank account details are required (IBAN, account number, or bank account)' 
        });
        return;
      }
    }

    // Calculate fee
    let fee = 0;
    if (validatedData.method === 'crypto' && validatedData.asset) {
      fee = calculateWithdrawalFee(validatedData.asset, validatedData.amount);
    }
    // Bank transfers have no fee in this implementation

    // Check balance
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const balance = await Balance.findOne({ userId: userObjectId });
    const totalRequired = validatedData.amount + fee;

    if (!balance || balance.available < totalRequired) {
      res.status(400).json({ 
        success: false, 
        error: 'Insufficient available balance' 
      });
      return;
    }

    // Create withdrawal
    const withdrawal = await Withdrawal.create({
      userId: req.user.id,
      method: validatedData.method,
      amount: validatedData.amount,
      currency: validatedData.currency || 'USD',
      fee,
      netAmount: validatedData.amount,
      status: WithdrawalStatus.INITIATED,
      
      // Crypto fields
      ...(validatedData.method === 'crypto' && {
        asset: validatedData.asset,
        network: validatedData.network,
        address: validatedData.address,
      }),
      
      // Bank transfer fields
      ...(validatedData.method === 'bank_transfer' && {
        bankAccount: validatedData.bankAccount,
        iban: validatedData.iban,
        swiftCode: validatedData.swiftCode,
        accountNumber: validatedData.accountNumber,
        routingNumber: validatedData.routingNumber,
        bankName: validatedData.bankName,
        beneficiaryName: validatedData.beneficiaryName,
      }),
      
      transactionIds: validatedData.transactionIds || [],
    });

    // Update balance
    balance.available -= totalRequired;
    await balance.save();

    res.status(201).json({ 
      success: true, 
      message: 'Withdrawal initiated',
      data: withdrawal 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
      return;
    }
    console.error('Create withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Failed to create withdrawal' });
  }
};

export const listWithdrawals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { status, asset, method, page = 1, limit = 10 } = req.query;
    let query: any = {};

    // For merchants, only show their own withdrawals
    if (req.user.role === UserRole.MERCHANT) {
      query.userId = req.user.id;
    } else if (req.query.merchantId) {
      // For ops/admin, allow filtering by merchantId (userId)
      query.userId = req.query.merchantId;
    }

    // Apply filters
    if (status) query.status = status;
    if (asset) query.asset = asset;
    if (method) query.method = method;

    const withdrawals = await Withdrawal.find(query)
      .populate('userId', 'legalName supportEmail email')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Withdrawal.countDocuments(query);

    res.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('List withdrawals error:', error);
    res.status(500).json({ success: false, error: 'Failed to list withdrawals' });
  }
};

export const getWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const withdrawal = await Withdrawal.findById(id).populate('userId', 'legalName supportEmail email');

    if (!withdrawal) {
      res.status(404).json({ success: false, error: 'Withdrawal not found' });
      return;
    }

    // Check authorization
    if (req.user.role === UserRole.MERCHANT) {
      if (withdrawal.userId._id.toString() !== req.user.id) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
    }

    res.json({ success: true, data: withdrawal });
  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Failed to get withdrawal' });
  }
};

export const updateWithdrawalStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || ![UserRole.FINANCE, UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { id } = req.params;
    const { status, txHash, confirmations, failureReason } = req.body;

    const validStatuses = [WithdrawalStatus.ON_CHAIN, WithdrawalStatus.PAID, WithdrawalStatus.FAILED, WithdrawalStatus.REVERSED];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      res.status(404).json({ success: false, error: 'Withdrawal not found' });
      return;
    }

    withdrawal.status = status;
    
    if (txHash) withdrawal.txHash = txHash;
    if (confirmations !== undefined) withdrawal.confirmations = confirmations;
    
    if (status === WithdrawalStatus.ON_CHAIN && txHash && withdrawal.network) {
      // Generate explorer URL based on network
      const explorerUrls: Record<string, string> = {
        'TRC20': `https://tronscan.org/#/transaction/${txHash}`,
        'ERC20': `https://etherscan.io/tx/${txHash}`,
        'BTC': `https://blockchain.info/tx/${txHash}`,
        'ETH': `https://etherscan.io/tx/${txHash}`,
      };
      withdrawal.explorerUrl = explorerUrls[withdrawal.network] || '';
    }

    if (status === WithdrawalStatus.PAID) {
      // Mark as completed
      withdrawal.completedAt = new Date();
    }

    if (status === WithdrawalStatus.FAILED || status === WithdrawalStatus.REVERSED) {
      withdrawal.failureReason = failureReason;
      
      // Return funds to balance
      const withdrawalUserObjectId = new mongoose.Types.ObjectId(withdrawal.userId.toString());
      const balance = await Balance.findOne({ userId: withdrawalUserObjectId });
      if (balance) {
        balance.available += (withdrawal.amount + withdrawal.fee);
        await balance.save();
      }
    }

    await withdrawal.save();

    res.json({ 
      success: true, 
      message: `Withdrawal ${status}`,
      data: withdrawal 
    });
  } catch (error) {
    console.error('Update withdrawal status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update withdrawal status' });
  }
};

