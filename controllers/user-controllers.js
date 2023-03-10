const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const mongoose = require("mongoose");
const Contents = require("../models/contents");

require("dotenv").config();
const AWS = require("aws-sdk");
const TOKEN_KEY = process.env.JWT_KEY;
const REFRESH_KEY = process.env.REFRESH_KEY;
const ACCESS_KEY_ID = process.env.AWS_API_KEY;
const ACCESS_SECRET_KEY_ID = process.env.AWS_API_SECRET_KEY;
const ACCESS_REGION = process.env.AWS_REGION;
const s3 = new AWS.S3({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: ACCESS_SECRET_KEY_ID,
  region: ACCESS_REGION,
});

// 회원가입
const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(
      new HttpError("회원가입을 할 수 없습니다. 입력 값을 확인해 주세요.", 422)
    );
  }
  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "회원가입에 실패하였습니다. 다시 시도해 주세요",
      500
    );
    return next(error);
  }
  if (existingUser) {
    const error = new HttpError("이미 존재하는 이메일입니다.", 422);
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "회원가입에 실패하였습니다. 다시 시도해주세요",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    profileImg: req.file.location,
    contents: [],
    pair: [],
  });
  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "회원가입에 실패하였습니다. 다시 시도해 주세요",
      500
    );
    return next(error);
  }

  let token;
  let refreshToken;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      TOKEN_KEY,
      { expiresIn: "1h" }
    );
    refreshToken = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      REFRESH_KEY,
      {
        expiresIn: "14d",
      }
    );
  } catch (err) {
    const error = new HttpError("로그인에 실패하였습니다.", 500);
    return next(error);
  }

  const UserContents = mongoose.model(`${createdUser.id}`, Contents);

  try {
    await UserContents.createCollection();
  } catch (err) {
    console.log(err);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    name: createdUser.name,
    token: token,
    refreshToken: refreshToken,
  });
};

// 로그인
const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "로그인에 실패하였습니다. 다시 시도해주세요.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("회원 정보가 없습니다.", 403);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError("비밀번호가 맞지 않습니다.", 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("비밀번호가 올바르지 않습니다.", 403);
    return next(error);
  }

  let token;
  let refreshToken;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      TOKEN_KEY,
      {
        expiresIn: "1h",
      }
    );
    refreshToken = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      REFRESH_KEY,
      {
        expiresIn: "14d",
      }
    );
  } catch (err) {
    const error = new HttpError(
      "로그인을 할 수 없습니다. 입력한 정보를 확인해 주세요.",
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    token: token,
    refreshToken: refreshToken,
  });
};

// 아이디 찾기
const findId = async (req, res, next) => {
  const { name } = req.body;

  let foundUser;
  try {
    foundUser = await User.find({ name: name }, [
      "-password",
      "-contents",
      "-pair",
      "-__v",
    ]);
  } catch (err) {
    const error = new HttpError("아이디가 없습니다.", 403);
    return next(error);
  }
  if (foundUser.length === 0) {
    const error = new HttpError("아이디가 없습니다.", 404);
    return next(error);
  }
  res.status(200).json({ foundUser });
};

// 유저 확인
const checkUser = async (req, res, next) => {
  const { refresh } = req.body;
  try {
    const decodedToken = jwt.verify(refresh, REFRESH_KEY);
    const newToken = jwt.sign(
      { userId: decodedToken.userId, email: decodedToken.email },
      TOKEN_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({ token: newToken });
  } catch (err) {
    console.log("유효하지 않은 리프레시 토큰");
  }
};

// 아래는 인증시스템

// 토큰 확인

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "인증오류입니다." });
  }
  try {
    const decodedToken = jwt.verify(token, TOKEN_KEY);
    req.userData = { userId: decodedToken.userId };
    res.status(200).json({ message: "유효합니다." });
  } catch (err) {
    res.status(400).json({ message: "유효하지 않은 토큰입니다." });
  }
};

// 친구 찾기

const findUser = async (req, res, next) => {
  const email = req.params.mail;
  let foundUser;
  try {
    foundUser = await User.findOne({ email: email })
      .select(["-password", "-contents", "-pair", "-__v"])
      .populate("pair", ["-password", "-pair", "-__v"]);
  } catch (err) {
    const error = new HttpError("알수없는 에러가 발생하였습니다.", 500);
    return next(error);
  }
  if (!foundUser) {
    const error = new HttpError("존재하지 않는 아이디입니다.", 404);
    return next(error);
  }

  res.json({ foundUser: foundUser.toObject({ getters: true }) });
};

// 친구 찾기, 추가하기

const createPair = async (req, res, next) => {
  const { pairEmail, pairId } = req.body;

  let foundUser;
  try {
    foundUser = await User.findOne({ email: pairEmail });
  } catch (err) {
    const error = new HttpError("알수없는 에러가 발생하였습니다.", 500);
    return next(error);
  }

  if (!foundUser) {
    const error = new HttpError("존재하지 않는 아이디입니다.", 404);
    return next(error);
  }

  let myInfo;

  try {
    myInfo = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  try {
    const isExistPair = myInfo.pair.find((el) => el.toString() === pairId);

    if (!isExistPair) {
      myInfo.pair.push(foundUser);
    } else {
      const error = new HttpError("이미 짝꿍입니다!", 400);
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.1", 500);
    return next(error);
  }

  try {
    const isExistPair = foundUser.pair.find(
      (el) => el.toString() === myInfo.id.toString()
    );
    if (!isExistPair) {
      foundUser.pair.push(myInfo);
    } else {
      const error = new HttpError("이미 짝꿍입니다!", 400);
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.1", 500);
    return next(error);
  }

  try {
    await myInfo.save();
    await foundUser.save();
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  res.status(201).json({ message: "친구 등록에 성공하였습니다." });
};

// 친구 목록 불러오기

const getPair = async (req, res, next) => {
  let pair;
  try {
    const myData = await User.findById(req.userData.userId).populate("pair", [
      "-password",
      "-contents",
      "-pair",
      "-__v",
    ]);
    pair = myData.pair;
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }
  res.status(200).json(pair);
};

// 친구 삭제하기

const deletePair = async (req, res, next) => {
  const { pairId } = req.body;

  let myInfo;
  let pairInfo;
  try {
    myInfo = await User.findById(req.userData.userId);
    pairInfo = await User.findById(pairId);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  if (!pairInfo) {
    myInfo.pair = myInfo.pair.filter((el) => el.toString() !== pairId);
    await myInfo.save();
    res.status(200).json({ message: "친구가 탈퇴한 것 같습니다..." });
  } else {
    myInfo.pair = myInfo.pair.filter((el) => el.toString() !== pairId);

    pairInfo.pair = pairInfo.pair.filter(
      (el) => el.toString() !== req.userData.userId
    );
    try {
      await myInfo.save();
      await pairInfo.save();
    } catch (err) {
      const error = new HttpError("알 수 없는 오류가 발생하였습니다.1", 500);
      return next(error);
    }

    res.status(200).json({ message: "친구 삭제가 완료되었습니다." });
  }
};

// 회원탈퇴
const deleteUser = async (req, res, next) => {
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  const imagePath = user.profileImg;
  const splitImagePath = imagePath.split("/");
  const imageKey = splitImagePath[splitImagePath.length - 1];

  const UserContents = mongoose.model(`${req.userData.userId}`, Contents);

  let userStory;

  try {
    userStory = await UserContents.find({}, ["image", "-_id"]);
  } catch (err) {
    console.log(err);
  }

  if (userStory) {
    const splitUserContentsImage = userStory.map((el) => {
      const splitting = el.image.split("/");
      const deletedContentsImage = splitting[splitting.length - 1];
      return deletedContentsImage;
    });
    const deleteUserContentsImage = splitUserContentsImage.map((el) => ({
      Key: el,
    }));

    s3.deleteObjects(
      {
        Bucket: "3dadaily",
        Delete: {
          Objects: deleteUserContentsImage,
        },
      },
      (err, data) => {
        if (err) console.log(err);
        else console.log(data);
      }
    );
  }

  if (!UserContents) {
    s3.deleteObject(
      {
        Bucket: "3dadaily",
        Key: imageKey,
      },
      (err, data) => {
        if (err) console.log(err);
        else console.log(data);
      }
    );
    res.status(200).json({ message: "회원 탈퇴가 완료되었습니다." });
  } else {
    try {
      await UserContents.collection.drop();
    } catch (err) {
      console.log(err);
      return next();
    }
  }
  s3.deleteObject(
    {
      Bucket: "3dadaily",
      Key: imageKey,
    },
    (err, data) => {
      if (err) console.log(err);
      else console.log(data);
    }
  );

  if (!user) {
    const error = new HttpError("유저를 찾을 수 없습니다.", 400);
    return next(error);
  }
  try {
    await user.remove();
  } catch (err) {
    const error = new HttpError(
      "알 수 없는 오류로 회원 탈퇴를 할 수 없습니다.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "회원 탈퇴가 완료되었습니다." });
};

// 비밀번호 재설정

const resetPassword = async (req, res, next) => {
  const { password, newPassword } = req.body;
  let foundUser;
  try {
    foundUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, foundUser.password);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError("기존 비밀번호를 확인해 주세요.", 403);
    return next(error);
  }

  let hashedNewPassword;
  try {
    hashedNewPassword = await bcrypt.hash(newPassword, 12);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  foundUser.password = hashedNewPassword;

  try {
    await foundUser.save();
  } catch (err) {
    const error = new HttpError(
      "비밀번호 변경이 실패하였습니다. 다시 시도해 주세요.",
      500
    );
    return next(error);
  }
  res.json({ message: "비밀번호가 재설정 되었습니다." });
};

// 프로필 이미지 변경

const changeProfile = async (req, res, next) => {
  const { name } = req.body;
  let foundUser;
  try {
    foundUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  if (req.file) {
    const splitImagePath = foundUser.profileImg.split("/");
    const imageKey = splitImagePath[splitImagePath.length - 1];
    s3.deleteObject(
      {
        Bucket: "3dadaily",
        Key: imageKey,
      },
      (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log(data);
        }
      }
    );
  }

  foundUser.profileImg =
    req.file !== undefined ? req.file.location : foundUser.profileImg;
  foundUser.name = name;

  try {
    await foundUser.save();
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  res.status(200).json({ message: "프로필이 변경되었습니다." });
};

exports.login = login;
exports.signUp = signUp;
exports.verifyToken = verifyToken;
exports.checkUser = checkUser;
exports.findId = findId;
exports.findUser = findUser;
exports.createPair = createPair;
exports.getPair = getPair;
exports.deletePair = deletePair;
exports.deleteUser = deleteUser;
exports.resetPassword = resetPassword;
exports.changeProfile = changeProfile;
