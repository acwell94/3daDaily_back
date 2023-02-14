const multer = require("multer");
const multerS3 = require("multer-s3");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
// const MIME_TYPE_MAP = {
//   "image/png": "png",
//   "image/jpeg": "jpeg",
//   "image/jpg": "jpg",
// };

const ACCESS_KEY_ID = process.env.AWS_API_KEY;
const ACCESS_SECRET_KEY_ID = process.env.AWS_API_SECRET_KEY;
const ACCESS_REGION = process.env.AWS_REGION;
const s3 = new AWS.S3({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: ACCESS_SECRET_KEY_ID,
  region: ACCESS_REGION,
});

// const fileUpload = multer({
//   limits: 500000,
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "uploads/images");
//     },
//     filename: (req, file, cb) => {
//       const ext = MIME_TYPE_MAP[file.mimetype];
//       cb(null, uuidv4() + "." + ext);
//     },
//   }),
//   fileFilter: (req, file, cb) => {
//     const isValid = !!MIME_TYPE_MAP[file.mimetype];
//     let error = isValid ? null : new Error("Invalid mime type");
//     cb(error, isValid);
//   },
// });

// const storage = multerS3({
//   s3: s3,
//   bucket: "3dadaily",
//   contentType: multerS3.AUTO_CONTENT_TYPE,
//   acl: "public-read",
//   metadata: function (req, file, cb) {
//     console.log(file, "file");
//     cb(null, { fieldName: file.fieldname });
//   },
//   key: function (req, file, cb) {
//     cb(null, `contents/${Date.now()}_${file.originalname}`);
//   },
// });

// const fileUpload = multer({
//   storage: storage, // storage를 multer_s3 객체로 지정
// });

// module.exports = fileUpload;

const fileUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "3dadaily",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, uuidv4());
    },
  }),
});
module.exports = fileUpload;
