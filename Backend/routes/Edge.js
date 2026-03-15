const router = require('express').Router();
const Edge = require('../models/Edge');

// get all edges
router.get('/', async (req, res) => {
  const edges = await Edge.find();
  res.json(edges);
});

// add a new edge
router.post('/', async (req, res) => {
  try {
    const edge = new Edge(req.body);
    await edge.save();
    res.json(edge);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete an edge
router.delete('/:id', async (req, res) => {
  await Edge.findByIdAndDelete(req.params.id);
  res.json({ message: 'Edge deleted' });
});

module.exports = router;