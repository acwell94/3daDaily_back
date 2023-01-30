const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const mongoose = require("mongoose");
const Contents = require("../models/contents");
let EXAMPLE_DATA = [
  {
    name: "minyoung",
    email: "test@test.com",
    password: "moon1808316@",
    profileImg:
      "http://t1.daumcdn.net/friends/prod/editor/dc8b3d02-a15a-4afa-a88b-989cf2a50476.jpg",
    contents: [],
    pair: [],
  },
];
// 친구 찾기

const findUser = async (req, res, next) => {
  const email = req.params.mail;
  let foundUser;
  try {
    foundUser = await User.findOne({ email: email }).populate("pair", [
      "-password",
      "-pair",
      "-__v",
    ]);
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
  const { pairEmail, pairId, myId } = req.body;

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
    myInfo = await User.findById(myId);
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
    console.log(err);
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

// 친구 삭제하기

const deletePair = async (req, res, next) => {
  const { pairId, myId } = req.body;

  let myInfo;
  let pairInfo;
  try {
    myInfo = await User.findById(myId);
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

    pairInfo.pair = pairInfo.pair.filter((el) => el.toString() !== myId);
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

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "testToken",
      {
        expiresIn: "1h",
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
  const { name, email, password, profileImg } = req.body;
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
    profileImg:
      "http://t1.daumcdn.net/friends/prod/editor/dc8b3d02-a15a-4afa-a88b-989cf2a50476.jpg",
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
      "testToken",
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
// 회원탈퇴
const deleteUser = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
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
  const UserContents = mongoose.model(`${userId}`, Contents);
  if (!UserContents) {
    res.status(200).json({ message: "회원 탈퇴가 완료되었습니다." });
  } else {
    try {
      await UserContents.collection.drop();
    } catch (err) {
      console.log(err);
      return next();
    }
  }
  res.status(200).json({ message: "회원 탈퇴가 완료되었습니다." });
};
exports.findUser = findUser;
exports.createPair = createPair;
exports.deletePair = deletePair;
exports.login = login;
exports.signUp = signUp;
exports.deleteUser = deleteUser;
