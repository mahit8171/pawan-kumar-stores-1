const router = require('express').Router();
const Product = require('../models/Product');

// GET /api/categories — returns distinct active categories with counts
router.get('/', async (req, res) => {
  try {
    const pipeline = [
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ];
    const results = await Product.aggregate(pipeline);
    const categories = results.map(r => ({ name: r._id || 'General', count: r.count }));
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

module.exports = router;
