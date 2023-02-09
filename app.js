const fs = require("fs");
const path = require("path");
const express = require(`express`);
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const usersRouter = require("./routes/users-routes");
const contentsRouter = require("./routes/contents-routes");
const HttpError = require("./models/http-error");
require("dotenv").config();
const app = express();

app.use(bodyParser.json());
app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

app.use("/users", usersRouter);
app.use("/contents", contentsRouter);

app.use((req, res, next) => {
  const error = new HttpError("경로를 찾을 수 없습니다.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

const port = process.env.PORT;
const mongoPW = process.env.MONGO_PW;
mongoose
  .connect(
    `mongodb+srv://leminyoung:${mongoPW}@cluster0.smkjlnw.mongodb.net/3dadaily?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(port);
    console.log("connected");
  })
  .catch((err) => {
    console.log(err);
  });
