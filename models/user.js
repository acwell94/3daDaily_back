const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true, minlength: 10 },
  profileImg: { type: String, required: true },
  contents: [{ type: mongoose.Types.ObjectId, required: true, ref: "Content" }],
  pair: [{ type: mongoose.Types.ObjectId, required: true }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
