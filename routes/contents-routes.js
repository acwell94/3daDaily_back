const express = require('express');

const { check } = require('express-validator');

const router = express.Router();

const contentsControllers = require('../controllers/contents-controllers');

router.post(
  '/',
  [
    check('title').not().isEmpty(),
    check('description').not().isEmpty().isLength({ min: 10 }),
    check('date').not().isEmpty(),
    check('weather').not().isEmpty(),
    check('address').not().isEmpty(),
    check('withWhom').not().isEmpty(),
    check('what').not().isEmpty(),
    check('feeling').not().isEmpty(),
    // check('image').not().isEmpty(),
  ],
  contentsControllers.createContents
);

module.exports = router;
