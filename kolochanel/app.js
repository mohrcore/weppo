var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
const passport = require('passport');
const localauth = require('./localauth');
const session = require("express-session");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var interactionRouter = require('./routes/interaction_view');
var userpageRouter = require('./routes/userpage');
var endpointRouter = require('./routes/toilet_provider');

/* passport.use(localauth.strategy);
passport.deserializeUser(localauth.deserializeUser);
passport.serializeUser(localauth.serializeUser);
 */

localauth.setup();

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({ secret: 'catboys' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(logger('dev'));
/* app.use(localauth.passport.initialize()); */
app.use(localauth.passport.session());
app.use(express.json());
/* app.use(express.urlencoded({ extended: false })); */
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/interactions', interactionRouter);
app.use('/userpage', userpageRouter);
app.use('/endpoint', endpointRouter);

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
