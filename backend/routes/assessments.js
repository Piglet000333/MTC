const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');

router.get('/', async (req, res) => {
  res.json(await Assessment.find());
});

router.post('/', async (req, res) => {
  res.status(201).json(await Assessment.create(req.body));
});

router.put('/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.json(assessment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    res.json({ message: 'Assessment deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
