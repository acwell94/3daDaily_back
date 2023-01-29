const express = require("express");

const { check } = require("express-validator");

const router = express.Router();

const userControllers = require("../controllers/user-controllers");

router.get("/findUser/:mail", userControllers.findUser);
router.post("/createPair", userControllers.createPair);
router.post("/deletePair", userControllers.deletePair);
router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 10 }),
  ],
  userControllers.signUp
);

router.post("/login", userControllers.login);

router.delete("/:uid", userControllers.deleteUser);

module.exports = router;
