const express = require("express");

const { check } = require("express-validator");

const router = express.Router();

const contentsControllers = require("../controllers/contents-controllers");
const checkAuth = require("../middleware/check-auth");

router.get("/:cid", contentsControllers.getContents);

router.use(checkAuth);

router.post(
  "/",
  [
    check("title").not().isEmpty(),
    check("firstContents").not().isEmpty().isLength({ min: 10 }),
    check("secondContents").not().isEmpty().isLength({ min: 10 }),
    check("thirdContents").not().isEmpty().isLength({ min: 10 }),
    check("date").not().isEmpty(),
    check("weather").not().isEmpty(),
    check("address").not().isEmpty(),
    check("withWhom").not().isEmpty(),
    check("what").not().isEmpty(),
    check("feeling").not().isEmpty(),
    // check('image').not().isEmpty(),
  ],
  contentsControllers.createContents
);

router.delete("/:cid/:pid", contentsControllers.deleteContents);
module.exports = router;
