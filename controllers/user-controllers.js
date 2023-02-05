const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const mongoose = require("mongoose");
const Contents = require("../models/contents");
const fs = require("fs");
require("dotenv").config();

const TOKEN_KEY = process.env.JWT_KEY;
const REFRESH_KEY = process.env.REFRESH_KEY;

// 유저 확인

const checkUser = async (req, res, next) => {
  const { refreshToken } = req.body;
  console.log(refreshToken, "refresh");
  if (req.method === "OPTIONS") {
    return next();
  }
  let newToken;
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, TOKEN_KEY);
  } catch (err) {
    console.log(err);
    if (err.message === "jwt expired") {
      try {
        const decodedRefresh = jwt.verify(refreshToken, REFRESH_KEY);

        newToken = jwt.sign(
          { userId: decodedRefresh.userId, email: decodedRefresh.email },
          TOKEN_KEY,
          {
            expiresIn: "1h",
          }
        );

        res.json({
          userId: decodedRefresh.userId,
          email: decodedRefresh.email,
          token: newToken,
          refreshToken: refreshToken,
        });
      } catch (err) {
        const error = new HttpError("인증이 만료되었습니다.", 401);
        return next(error);
      }
    }
  }
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
    token: token,
    refreshToken: refreshToken,
  });
};

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
    profileImg: req.file.path,
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
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      TOKEN_KEY,
      { expiresIn: "1h" }
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
  res.status(200).json({ foundUser });
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
  const imagePath = user.profileImg;

  const UserContents = mongoose.model(`${req.userData.userId}`, Contents);
  if (!UserContents) {
    fs.unlink(imagePath, (err) => {
      console.log(err);
    });
    res.status(200).json({ message: "회원 탈퇴가 완료되었습니다." });
  } else {
    try {
      await UserContents.collection.drop();
    } catch (err) {
      console.log(err);
      return next();
    }
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
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
    const error = new HttpError("기존 비밀번호와 동일합니다.", 500);
  }
  if (isValidPassword) {
    const error = new HttpError("기존 비밀번호와 동일합니다.", 403);
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
  res.status(200).json({ message: "비밀번호가 재설정 되었습니다." });
};

// 프로필 이미지 변경

const changeProfile = async (req, res, next) => {
  let foundUser;

  try {
    foundUser = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }
  const imagePath = foundUser.profileImg;

  foundUser.profileImg = req.file.path;

  try {
    await foundUser.save();
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200).json({ message: "프로필이 변경되었습니다." });
};

exports.login = login;
exports.signUp = signUp;
exports.checkUser = checkUser;
exports.findId = findId;
exports.findUser = findUser;
exports.createPair = createPair;
exports.getPair = getPair;
exports.deletePair = deletePair;
exports.deleteUser = deleteUser;
exports.resetPassword = resetPassword;
exports.changeProfile = changeProfile;
