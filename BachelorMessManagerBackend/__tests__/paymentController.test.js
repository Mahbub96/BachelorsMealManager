const paymentController = require('../src/controllers/paymentController');
const PaymentRequest = require('../src/models/PaymentRequest');
const User = require('../src/models/User');
const settlementService = require('../src/services/settlementService');
const ledgerService = require('../src/services/ledgerService');
const userController = require('../src/controllers/userController');
const { getGroupMemberIds } = require('../src/utils/groupHelper');
const mongoose = require('mongoose');

jest.mock('../src/models/PaymentRequest');
jest.mock('../src/models/User');
jest.mock('../src/services/settlementService');
jest.mock('../src/services/ledgerService');
jest.mock('../src/controllers/userController');
jest.mock('../src/utils/groupHelper');

describe('paymentController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { _id: new mongoose.Types.ObjectId().toString(), role: 'member' },
      body: {},
      query: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('createRequest', () => {
    it('creates a custom payment request', async () => {
      req.body = { type: 'custom', amount: 500, method: 'cash', notes: 'test' };
      PaymentRequest.create.mockResolvedValueOnce({ _id: 'req_id', toObject: () => ({ _id: 'req_id', amount: 500 }) });

      await paymentController.createRequest(req, res);

      expect(PaymentRequest.create).toHaveBeenCalledWith(expect.objectContaining({
        amount: 500,
        type: 'custom',
        method: 'cash',
        notes: 'test'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('creates a full_due payment request', async () => {
      req.body = { type: 'full_due', method: 'bank_transfer' };
      settlementService.getCurrentMonthSettlementForUser.mockResolvedValueOnce({ due: 1200 });
      PaymentRequest.create.mockResolvedValueOnce({ _id: 'req_id', toObject: () => ({ _id: 'req_id' }) });

      await paymentController.createRequest(req, res);

      expect(settlementService.getCurrentMonthSettlementForUser).toHaveBeenCalledWith(req.user);
      expect(PaymentRequest.create).toHaveBeenCalledWith(expect.objectContaining({
        amount: 1200,
        type: 'full_due',
        method: 'bank_transfer'
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('rejects full_due if there is no due amount', async () => {
      req.body = { type: 'full_due' };
      settlementService.getCurrentMonthSettlementForUser.mockResolvedValueOnce({ due: 0 });

      await paymentController.createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.stringContaining('No due amount') }));
      expect(PaymentRequest.create).not.toHaveBeenCalled();
    });
  });

  describe('approveRequest', () => {
    it('approves a request if user is admin', async () => {
      req.user.role = 'admin';
      req.params.id = new mongoose.Types.ObjectId().toString();
      
      const mockRequest = {
        _id: req.params.id,
        userId: new mongoose.Types.ObjectId().toString(),
        amount: 500,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
        toObject: function() { return this; }
      };

      User.findById.mockReturnValueOnce({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ role: 'admin' }) });
      PaymentRequest.findById.mockResolvedValueOnce(mockRequest);
      getGroupMemberIds.mockResolvedValueOnce([mockRequest.userId]);

      await paymentController.approveRequest(req, res);

      expect(userController.recordPayment).toHaveBeenCalledWith(mockRequest.userId, expect.objectContaining({ amount: 500 }));
      expect(mockRequest.status).toBe('approved');
      expect(mockRequest.save).toHaveBeenCalled();
      expect(ledgerService.createEntry).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('rejects if user is not admin', async () => {
      req.user.role = 'member';
      User.findById.mockReturnValueOnce({ select: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ role: 'member' }) });

      await paymentController.approveRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(PaymentRequest.findById).not.toHaveBeenCalled();
    });
  });
});
