/**
 * Smoke and sanity tests so CI and "npm test" pass.
 * Add unit/integration tests under __tests__/unit and __tests__/integration as needed.
 */

describe('smoke', () => {
  it('runs tests', () => {
    expect(true).toBe(true);
  });
});

describe('responseHandler', () => {
  const { sendSuccessResponse, sendErrorResponse } = require('../src/utils/responseHandler');

  it('sendSuccessResponse builds success payload', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    sendSuccessResponse(res, 200, 'OK', { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'OK',
        data: { id: 1 },
      })
    );
  });

  it('sendErrorResponse builds error payload', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    sendErrorResponse(res, 400, 'Bad request');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Bad request',
      })
    );
  });
});
