const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./dbops');

let strategy = new LocalStrategy(async (username, password, done) => {
  let user_id = await db.login_user(username, password);

  if (typeof(user_id) === 'string') {
    if ((user_id == 'no_account') || (user_id == 'wrong_pwd'))
      return done(null, false, {'message': 'User not found.'});
    else
    return done(null, false, {'message': 'Unknown error'});
  }
  return done(null, user_id);
});

async function deserializeUser(user_id, done) {
  console.log('Deserializing ' + user_id);
  return done(null, await db.getUserById(user_id));
}

function serializeUser(user, done) {
  return done(null, user._id);
}

function setup() {
  passport.deserializeUser(deserializeUser);
  passport.serializeUser(serializeUser);
  passport.use(strategy);
}

exports.strategy = strategy;
exports.deserializeUser = deserializeUser;
exports.serializeUser = serializeUser;
exports.setup = setup;
exports.passport = passport;