const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const Contents = require('../models/contents');

const getCoordsForAddress = require('../util/location');
const mongoose = require('mongoose');

let EXAMPLE_DATA = [
  {
    title: '잠실롯데타워',
    description: '우리나라에서 제일 높은 빌딩',
    date: '2023-01-12',
    weather: '1',
    location: {
      lat: 37,
      lng: 42,
    },
    withWhom: '1',
    what: '2',
    feeling: '2',
    image:
      'http://t1.daumcdn.net/friends/prod/editor/dc8b3d02-a15a-4afa-a88b-989cf2a50476.jpg',
    creator: '아이디',
  },
];

const createContents = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('빠진 내용이 있는 거 같습니다. 확인 한 번 해주세요', 422)
    );
  }

  const {
    title,
    description,
    date,
    weather,
    address,
    withWhom,
    what,
    feeling,
    image,
    creator,
  } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdContents = new Contents({
    title,
    description,
    date,
    weather,
    address,
    location: coordinates,
    withWhom,
    what,
    feeling,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/NYC_Empire_State_Building.jpg/640px-NYC_Empire_State_Building.jpg',
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError('알 수 없는 오류가 발생하였습니다.', 500);
    return next(error);
  }
  if (!user) {
    const error = new HttpError('유저를 찾을 수 없습니다.', 400);
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
    const error = new HttpError('일기 등록에 실패하였습니다.', 500);
    return next(error);
  }
  res.status(201).json({ createdContents });
};

exports.createContents = createContents;
