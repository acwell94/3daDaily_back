const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const Contents = require("../models/contents");

const getCoordsForAddress = require("../util/location");
const mongoose = require("mongoose");
const fs = require("fs");
const dataForm = require("../util/dateForm");

//  글 불러오기

const getContents = async (req, res, next) => {
  const { category, sort } = req.query;

  const userId = req.params.uid;
  const Story = mongoose.model(`${userId}`, Contents);

  let user;
  try {
    user = await User.findById(userId, [
      "-password",
      "-contents",
      "-pair",
      "-__v",
    ]);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
    return next(error);
  }

  let patchedContents;
  if (category && sort) {
    try {
      patchedContents = await Story.find({ [category]: sort }, ["-__v"]).sort({
        date: -1,
      });
    } catch (err) {
      const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
      return next(error);
    }
    res.status(200).json({
      user,
      story: patchedContents.map((contents) =>
        contents.toObject({ getters: true })
      ),
    });
  } else {
    try {
      patchedContents = await Story.find({}, ["-__v"]).sort({ date: -1 });
    } catch (err) {
      const error = new HttpError("알 수 없는 오류가 발생하였습니다.", 500);
      return next(error);
    }

    res.status(200).json({
      user,
      story: patchedContents.map((contents) =>
        contents.toObject({ getters: true })
      ),
    });
  }
};

// 게시글 디테일 불러오기

const getDetail = async (req, res, next) => {
  const contentsId = req.params.cid;
  const Story = mongoose.model(`${req.userData.userId}`, Contents);

  let foundData;

  try {
    foundData = await Story.findById(contentsId, ["-__v"]);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.1", 500);
    return next(error);
  }

  if (!foundData) {
    const error = new HttpError("글이 존재하지 않습니다.", 400);
    return next(error);
  }
  let user;

  try {
    user = await User.findById(req.userData.userId, [
      "-password",
      "-contents",
      "-pair",
      "-__v",
      "-profileImg",
    ]);
  } catch (err) {
    const error = new HttpError("알 수 없는 오류가 발생하였습니다.2", 500);
    return next(error);
  }

  res.json({ user, foundData });
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
    // image,
  } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const selectedDate = dataForm(new Date(date));

  const UserContents = mongoose.model(`${req.userData.userId}`, Contents);
  const createdContents = new UserContents({
    title,
    firstContents,
    secondContents,
    thirdContents,
    date: selectedDate,
    originDate: date,
    weather,
    address,
    location: coordinates,
    withWhom,
    what,
    feeling,
    image: req.file.path,
    // image,
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
  const selectedDate = dataForm(new Date(date));
  const imagePath = contents.image;

  contents.title = title;
  contents.firstContents = firstContents;
  contents.secondContents = secondContents;
  contents.thirdContents = thirdContents;
  contents.date = selectedDate;
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
exports.getDetail = getDetail;
exports.updateContents = updateContents;
exports.deleteContents = deleteContents;
