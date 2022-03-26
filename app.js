var createError = require('http-errors');
var express = require('express');
const cors = require("cors"); // Cors middleware
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/editUsers", require("./routes/editUsers"));
app.use("/auth", require("./routes/auth"));
app.use("/schedule", require("./routes/schedule"));
app.use("/record", require("./routes/record"));
app.use("/feedback", require("./routes/feedback"));
app.use("/admin", require("./routes/admin"));
//app.use("/counsellor", require("./routes/counsellor"));
//app.use("/supervisor", require("./routes/supervisor"));
//app.use("/visitor", require("./routes/visitor"));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
