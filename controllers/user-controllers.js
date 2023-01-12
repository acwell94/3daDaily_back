const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');

const User = require('../models/user');

let EXAMPLE_DATA = [
  {
    name: 'minyoung',
    email: 'test@test.com',
    password: 'moon1808316@',
    profileImg:
      'http://t1.daumcdn.net/friends/prod/editor/dc8b3d02-a15a-4afa-a88b-989cf2a50476.jpg',
    contents: [],
    pair: [],
  },
];

const signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(
      new HttpError('회원가입을 할 수 없습니다. 입력 값을 확인해 주세요.', 422)
    );
  }
  const { name, email, password, profileImg } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      '회원가입에 실패하였습니다. 다시 시도해 주세요',
      500
    );
    return next(error);
  }
  if (existingUser) {
    const error = new HttpError('이미 존재하는 이메일입니다.', 422);
    return next(error);
  }
  const createUser = new User({
    name,
    email,
    password,
    profileImg:
      'http://t1.daumcdn.net/friends/prod/editor/dc8b3d02-a15a-4afa-a88b-989cf2a50476.jpg',
    contents: [],
    pair: [],
  });
  try {
    await createUser.save();
  } catch (err) {
    const error = new HttpError(
      '회원가입에 실패하였습니다. 다시 시도해 주세요',
      500
    );
    return next(error);
  }

  res.status(201).json({ user: createUser.toObject({ getters: true }) });
};

const deleteUser = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    const error = new HttpError('알 수 없는 오류가 발생하였습니다.', 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('유저를 찾을 수 없습니다.', 400);
    return next(error);
  }
  try {
    await user.remove();
  } catch (err) {
    const error = new HttpError(
      '알 수 없는 오류로 회원 탈퇴를 할 수 없습니다.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: '회원 탈퇴가 완료되었습니다.' });
};

exports.signUp = signUp;
exports.deleteUser = deleteUser;
