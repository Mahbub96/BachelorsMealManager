/**
 * Comprehensive Security & Feature Tests — refundController
 *
 * Coverage:
 *  sendRefund   — role checks, memberId/userId body stripping guard,
 *                 amount validation, group membership, receivable cap
 *  listRefunds  — admin sees group, member sees own, non-member scoping
 *  acknowledgeRefund — ownership, wrong status transitions, not-found
 */

const refundController = require('../src/controllers/refundController');
const Refund = require('../src/models/Refund');
const User = require('../src/models/User');
const settlementService = require('../src/services/settlementService');
const ledgerService = require('../src/services/ledgerService');
const { getGroupMemberIds } = require('../src/utils/groupHelper');
const mongoose = require('mongoose');

jest.mock('../src/models/Refund');
jest.mock('../src/models/User');
jest.mock('../src/services/settlementService');
jest.mock('../src/services/ledgerService');
jest.mock('../src/utils/groupHelper');
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────
function newId() {
  return new mongoose.Types.ObjectId();
}
function idStr(id) {
  return id.toString();
}

function makeRes() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
}

function makeReq(role, body = {}, params = {}) {
  return {
    user: { _id: newId(), role },
    body,
    params,
    query: {},
  };
}

// ─── sendRefund ────────────────────────────────────────────────────────────
describe('sendRefund', () => {
  const adminId = newId();
  const memberId = newId();

  function setupAdmin(req) {
    req.user._id = adminId;
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ role: 'admin' }),
    });
  }

  function setupGroupAndSettlement(memberReceive = 1000) {
    getGroupMemberIds.mockResolvedValue([adminId, memberId]);
    settlementService.getCurrentMonthSettlementForGroup.mockResolvedValue({
      members: [{ userId: memberId, receive: memberReceive }],
    });
  }

  function setupRefundCreate(amount = 500) {
    const fake = { _id: newId(), amount, status: 'sent', toObject() { return this; } };
    Refund.create.mockResolvedValue(fake);
    ledgerService.createEntry.mockResolvedValue({});
    return fake;
  }

  beforeEach(() => jest.clearAllMocks());

  // ── Happy-path: memberId field (new fixed field name) ──
  it('[SECURITY] accepts memberId (not stripped by httpClient)', async () => {
    const req = makeReq('admin', { memberId: idStr(memberId), amount: 400, method: 'cash' });
    const res = makeRes();
    setupAdmin(req);
    setupGroupAndSettlement(800);
    setupRefundCreate(400);

    await refundController.sendRefund(req, res);

    expect(Refund.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 400, status: 'sent' }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // ── Backward-compat: legacy userId field still works ──
  it('[COMPAT] accepts legacy userId field in body', async () => {
    const req = makeReq('admin', { userId: idStr(memberId), amount: 300, method: 'bank_transfer' });
    const res = makeRes();
    setupAdmin(req);
    setupGroupAndSettlement(1000);
    setupRefundCreate(300);

    await refundController.sendRefund(req, res);

    expect(Refund.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 300 }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ── Security: member must not send refunds ──
  it('[SECURITY] returns 403 if caller is not admin', async () => {
    const req = makeReq('member', { memberId: idStr(memberId), amount: 100 });
    const res = makeRes();
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ role: 'member' }),
    });

    await refundController.sendRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Admin') }));
    expect(Refund.create).not.toHaveBeenCalled();
  });

  // ── Security: body with NEITHER memberId nor userId ──
  it('[SECURITY] returns 400 if memberId and userId are both absent', async () => {
    const req = makeReq('admin', { amount: 200, method: 'cash' }); // no memberId / userId
    const res = makeRes();
    setupAdmin(req);

    await refundController.sendRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(Refund.create).not.toHaveBeenCalled();
  });

  // ── Validation: amount zero/negative ──
  it('[VALIDATION] returns 400 for amount = 0', async () => {
    const req = makeReq('admin', { memberId: idStr(memberId), amount: 0 });
    const res = makeRes();
    setupAdmin(req);

    await refundController.sendRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid amount' }));
  });

  it('[VALIDATION] returns 400 for negative amount', async () => {
    const req = makeReq('admin', { memberId: idStr(memberId), amount: -50 });
    const res = makeRes();
    setupAdmin(req);

    await refundController.sendRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('[VALIDATION] returns 400 for non-numeric amount', async () => {
    const req = makeReq('admin', { memberId: idStr(memberId), amount: 'abc' });
    const res = makeRes();
    setupAdmin(req);

    await refundController.sendRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ── Security: cross-group access — member not in admin's group ──
  it('[SECURITY] returns 403 if target member is not in admin\'s group', async () => {
    const outsiderId = newId();
    const req = makeReq('admin', { memberId: idStr(outsiderId), amount: 100 });
    const res = makeRes();
    setupAdmin(req);
    getGroupMemberIds.mockResolvedValue([adminId, memberId]); // outsiderId NOT in group
    settlementService.getCurrentMonthSettlementForGroup.mockResolvedValue({ members: [] });

    await refundController.sendRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('group') }));
    expect(Refund.create).not.toHaveBeenCalled();
  });

  // ── Business logic: amount exceeds receivable ──
  it('[BUSINESS] returns 400 if amount exceeds member receivable', async () => {
    const req = makeReq('admin', { memberId: idStr(memberId), amount: 1500 });
    const res = makeRes();
    setupAdmin(req);
    setupGroupAndSettlement(1000); // max = 1000

    await refundController.sendRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('receivable') }));
    expect(Refund.create).not.toHaveBeenCalled();
  });

  // ── Business logic: exact max receivable is allowed ──
  it('[BUSINESS] allows refund equal to exact receivable amount', async () => {
    const req = makeReq('admin', { memberId: idStr(memberId), amount: 1000, method: 'cash' });
    const res = makeRes();
    setupAdmin(req);
    setupGroupAndSettlement(1000);
    setupRefundCreate(1000);

    await refundController.sendRefund(req, res);

    expect(Refund.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ── Method validation: invalid payment method defaults to cash ──
  it('[VALIDATION] sanitizes invalid method to cash', async () => {
    const req = makeReq('admin', { memberId: idStr(memberId), amount: 200, method: 'bitcoin' });
    const res = makeRes();
    setupAdmin(req);
    setupGroupAndSettlement(500);
    setupRefundCreate(200);

    await refundController.sendRefund(req, res);

    expect(Refund.create).toHaveBeenCalledWith(expect.objectContaining({ method: 'cash' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // ── Ledger is always written for successful refunds ──
  it('[AUDIT] writes to ledger on successful refund', async () => {
    const req = makeReq('admin', { memberId: idStr(memberId), amount: 100, method: 'cash' });
    const res = makeRes();
    setupAdmin(req);
    setupGroupAndSettlement(500);
    setupRefundCreate(100);

    await refundController.sendRefund(req, res);

    expect(ledgerService.createEntry).toHaveBeenCalledWith(
      req.user,
      expect.objectContaining({ type: 'refund_sent', amount: 100 })
    );
  });
});

// ─── listRefunds ───────────────────────────────────────────────────────────
describe('listRefunds', () => {
  const adminId = newId();
  const memberId  = newId();

  const fakeRefund = (userId) => ({
    _id: newId(),
    userId: { _id: userId, name: 'Alice', email: 'a@test.com' },
    amount: 100,
    status: 'sent',
    method: 'cash',
    sentAt: new Date(),
    sentBy: { name: 'Admin' },
    createdAt: new Date(),
  });

  function mockRefundFind(list) {
    Refund.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(list),
    });
  }

  beforeEach(() => jest.clearAllMocks());

  it('[AUTH] admin sees all group refunds', async () => {
    const req = makeReq('admin');
    req.user._id = adminId;
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ role: 'admin' }),
    });
    getGroupMemberIds.mockResolvedValue([adminId, memberId]);
    mockRefundFind([fakeRefund(memberId)]);
    const res = makeRes();

    await refundController.listRefunds(req, res);

    expect(Refund.find).toHaveBeenCalledWith(expect.objectContaining({ userId: { $in: expect.any(Array) } }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.any(Array) }));
  });

  it('[AUTH] member only sees their own refunds', async () => {
    const req = makeReq('member');
    req.user._id = memberId;
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ role: 'member' }),
    });
    mockRefundFind([fakeRefund(memberId)]);
    const res = makeRes();

    await refundController.listRefunds(req, res);

    expect(Refund.find).toHaveBeenCalledWith(expect.objectContaining({ userId: memberId }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ─── acknowledgeRefund ────────────────────────────────────────────────────
describe('acknowledgeRefund', () => {
  const memberId = newId();
  const refundId = newId();

  const makeRefund = (overrides = {}) => ({
    _id: refundId,
    userId: memberId,
    amount: 500,
    status: 'sent',
    save: jest.fn().mockResolvedValue(true),
    toObject() { return this; },
    ...overrides,
  });

  beforeEach(() => jest.clearAllMocks());

  it('[HAPPY] acknowledges refund successfully', async () => {
    const req = makeReq('member', {}, { id: idStr(refundId) });
    req.user._id = memberId;
    const mockRefund = makeRefund();
    Refund.findById.mockResolvedValue(mockRefund);
    ledgerService.createEntry.mockResolvedValue({});
    const res = makeRes();

    await refundController.acknowledgeRefund(req, res);

    expect(mockRefund.status).toBe('acknowledged');
    expect(mockRefund.save).toHaveBeenCalled();
    expect(ledgerService.createEntry).toHaveBeenCalledWith(
      req.user,
      expect.objectContaining({ type: 'refund_acknowledged' })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('[SECURITY] returns 403 if refund belongs to another user', async () => {
    const otherUserId = newId();
    const req = makeReq('member', {}, { id: idStr(refundId) });
    req.user._id = memberId;
    Refund.findById.mockResolvedValue(makeRefund({ userId: otherUserId }));
    const res = makeRes();

    await refundController.acknowledgeRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Not your refund' }));
  });

  it('[VALIDATION] returns 404 if refund not found', async () => {
    const req = makeReq('member', {}, { id: idStr(refundId) });
    req.user._id = memberId;
    Refund.findById.mockResolvedValue(null);
    const res = makeRes();

    await refundController.acknowledgeRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Refund not found' }));
  });

  it('[VALIDATION] returns 400 if refund is already acknowledged', async () => {
    const req = makeReq('member', {}, { id: idStr(refundId) });
    req.user._id = memberId;
    Refund.findById.mockResolvedValue(makeRefund({ status: 'acknowledged' }));
    const res = makeRes();

    await refundController.acknowledgeRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Refund is not in sent status' }));
  });

  it('[VALIDATION] returns 400 if refund is in pending_refund status (not sent)', async () => {
    const req = makeReq('member', {}, { id: idStr(refundId) });
    req.user._id = memberId;
    Refund.findById.mockResolvedValue(makeRefund({ status: 'pending_refund' }));
    const res = makeRes();

    await refundController.acknowledgeRefund(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('[AUDIT] ledger entry written on acknowledge', async () => {
    const req = makeReq('member', {}, { id: idStr(refundId) });
    req.user._id = memberId;
    const mockRefund = makeRefund();
    Refund.findById.mockResolvedValue(mockRefund);
    ledgerService.createEntry.mockResolvedValue({});
    const res = makeRes();

    await refundController.acknowledgeRefund(req, res);

    expect(ledgerService.createEntry).toHaveBeenCalledTimes(1);
    expect(ledgerService.createEntry).toHaveBeenCalledWith(
      req.user,
      expect.objectContaining({ type: 'refund_acknowledged', amount: 500 })
    );
  });
});
