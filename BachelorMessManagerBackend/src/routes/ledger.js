const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth-simple');
const ledgerService = require('../services/ledgerService');

router.get('/', protect, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const { entries, total } = await ledgerService.getGroupLedger(req.user, page, limit);
    res.json({
      success: true,
      data: entries,
      pagination: { page, limit, total },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch ledger' });
  }
});

module.exports = router;
