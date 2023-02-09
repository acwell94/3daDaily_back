const express = require("express");

const { check } = require("express-validator");

const router = express.Router();

const contentsControllers = require("../controllers/contents-controllers");
const checkAuth = require("../middleware/check-auth");
const fileUpload = require("../middleware/file-upload");
router.get("/:uid", contentsControllers.getContents);
router.use(checkAuth);

router.get("/detail/:cid", contentsControllers.getDetail);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("firstContents").not().isEmpty(),
    check("secondContents").not().isEmpty(),
    check("thirdContents").not().isEmpty(),
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

router.patch(
  "/:pid",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("firstContents").not().isEmpty(),
    check("secondContents").not().isEmpty(),
    check("thirdContents").not().isEmpty(),
    check("date").not().isEmpty(),
    check("weather").not().isEmpty(),
    check("address").not().isEmpty(),
    check("withWhom").not().isEmpty(),
    check("what").not().isEmpty(),
    check("feeling").not().isEmpty(),
  ],
  contentsControllers.updateContents
);

router.delete("/:pid", contentsControllers.deleteContents);
module.exports = router;
