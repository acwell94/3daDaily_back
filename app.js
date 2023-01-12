const express = require(`express`);
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const usersRouter = require('./routes/users-routes');
const contentsRouter = require('./routes/contents-routes');
const HttpError = require('./models/http-error');
const app = express();

app.use(bodyParser.json());

app.use('/users', usersRouter);
app.use('/contents', contentsRouter);

app.use((req, res, next) => {
  const error = new HttpError('경로를 찾을 수 없습니다.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || '알 수 없는 에러가 발생하였습니다.' });
});

mongoose
  .connect(
    'mongodb+srv://leminyoung:moon1808316@cluster0.smkjlnw.mongodb.net/3dadaily?retryWrites=true&w=majority'
  )
  .then(() => {
    app.listen(5000);
    console.log('connected');
  })
  .catch((err) => {
    console.log(err);
  });
