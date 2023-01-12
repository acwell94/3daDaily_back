const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true }, // 관계설정 예정
  password: { type: String, required: true, minlength: 10 },
  profileImg: { type: String, required: true },
  contents: [{ type: String, required: true }], // 관계설정 예정
  pair: [{ type: String, required: true }], // 관계설정 예정
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
