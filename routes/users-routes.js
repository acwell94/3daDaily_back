const express = require("express");

const { check } = require("express-validator");

const router = express.Router();

const userControllers = require("../controllers/user-controllers");
const checkAuth = require("../middleware/check-auth");
const fileUpload = require("../middleware/file-upload");
router.post(
  "/signup",
  fileUpload.single("profileImg"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 10 }),
  ],
  userControllers.signUp
);

router.post("/login", userControllers.login);
router.post("/findId", userControllers.findId);
router.post("/checkUser", userControllers.checkUser);

router.use(checkAuth);
router.post("/token", userControllers.verifyToken);
router.get("/findUser/:mail", userControllers.findUser);
router.post("/createPair", userControllers.createPair);
router.get("/getPair", userControllers.getPair);
router.post("/deletePair", userControllers.deletePair);
router.delete("/:uid", userControllers.deleteUser);
router.patch("/resetPassword/:uid", userControllers.resetPassword);
router.patch(
  "/changeProfile",
  fileUpload.single("profileImg"),
  userControllers.changeProfile
);
module.exports = router;
