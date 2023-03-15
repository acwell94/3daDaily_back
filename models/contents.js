const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const contentsSchema = new Schema({
  title: { type: String, required: true },
  firstContents: { type: String },
  secondContents: { type: String },
  thirdContents: { type: String },
  date: { type: String, required: true },
  originDate: { type: String, required: true },
  weather: { type: String, required: true },
  address: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
  withWhom: { type: String, required: true },
  what: { type: String, required: true },
  feeling: { type: String, required: true },
  image: { type: String },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

contentsSchema.plugin(uniqueValidator);

// module.exports = mongoose.model("Contents", contentsSchema);
module.exports = contentsSchema;
