const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const Contents = require("../models/contents");

const getCoordsForAddress = require("../util/location");
const mongoose = require("mongoose");
const fs = require("fs");
let EXAMPLE_DATA = [
  {
    title: "잠실롯데타워",
    firstContents: "우리나라에서 제일 높은 빌딩",
    secondContents: "롯데꺼",
    thirdContents: "크다",
    date: "2023-01-12",
    weather: "1",
    address: "서울 송파구",
    location: {
      lat: 37,
      lng: 42,
    },
    withWhom: "1",
    what: "2",
    feeling: "2",
    image:
      "http://t1.daumcdn.net/friends/prod/editor/dc8b3d02-a15a-4afa-a88b-989cf2a50476.jpg",
    creator: "아이디",
  },
];

//  글 불러오기

const getContents = async (req, res, next) => {
  const userId = req.params.uid;
  const Story = mongoose.model(`${userId}`, Contents);
  let patchedContents;
  try {
    patchedContents = await Story.find({}).sort({ date: -1 });
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  if (patchedContents.length === 0) {
    const error = new HttpError("작성된 게시글이 없습니다.", 404);
    return next(error);
  }
  res.status(200).json({ story: patchedContents });
};

// 글 생성하기
const createContents = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("빠진 내용이 있는 거 같습니다. 확인 한 번 해주세요", 422)
    );
  }

  const {
    title,
    firstContents,
    secondContents,
    thirdContents,
    date,
    weather,
    address,
    withWhom,
    what,
    feeling,
  } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }
  const UserContents = mongoose.model(`${req.userData.userId}`, Contents);
  const createdContents = new UserContents({
    title,
    firstContents,
    secondContents,
    thirdContents,
    date,
    weather,
    address,
    location: coordinates,
    withWhom,
    what,
    feeling,
    image: req.file.path,
    creator: req.userData.userId,
  });

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
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdContents.save({ session: sess });

    user.contents.push(createdContents);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError("일기 등록에 실패하였습니다.", 500);
    return next(error);
  }
  res.status(201).json({ createdContents });
};

// 글 수정하기

const updateContents = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("입력 값을 확인해 주세요.", 422));
  }

  const contentsId = req.params.pid;

  const {
    title,
    firstContents,
    secondContents,
    thirdContents,
    date,
    weather,
    address,
    withWhom,
    what,
    feeling,
  } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const Story = mongoose.model(`${req.userData.userId}`, Contents);

  let contents;

  try {
    contents = await Story.findById(contentsId);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  if (contents.creator.toString() !== req.userData.userId) {
    const error = new HttpError("작성자가 아닙니다.", 401);
    return next(error);
  }

  const imagePath = contents.image;

  contents.title = title;
  contents.firstContents = firstContents;
  contents.secondContents = secondContents;
  contents.thirdContents = thirdContents;
  contents.date = date;
  contents.weather = weather;
  contents.address = address;
  contents.location = coordinates;
  contents.withWhom = withWhom;
  contents.what = what;
  contents.feeling = feeling;
  contents.image = req.file.path;

  try {
    await contents.save();
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ contents });
};

// 글 삭제

const deleteContents = async (req, res, next) => {
  const contentsId = req.params.pid;

  const Story = mongoose.model(`${req.userData.userId}`, Contents);

  let contents;
  try {
    contents = await Story.findById(contentsId).populate(
      "creator",
      "-password"
    );
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  if (!contents) {
    const error = new HttpError("삭제할 스토리가 없습니다.", 400);
    return next(error);
  }
  const imagePath = contents.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await contents.remove({ session: sess });
    contents.creator.contents.pull(contents);
    await contents.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "일기가 삭제되었습니다." });
};

exports.createContents = createContents;
exports.getContents = getContents;
exports.updateContents = updateContents;
exports.deleteContents = deleteContents;
