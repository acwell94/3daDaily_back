const express = require("express");

const { check } = require("express-validator");

const router = express.Router();

const userControllers = require("../controllers/user-controllers");
const checkAuth = require("../middleware/check-auth");

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

router.use(checkAuth);
router.get("/findUser/:mail", userControllers.findUser);
router.post("/createPair", userControllers.createPair);
router.get("/getPair", userControllers.getPair);
router.post("/deletePair", userControllers.deletePair);
router.delete("/:uid", userControllers.deleteUser);

module.exports = router;
