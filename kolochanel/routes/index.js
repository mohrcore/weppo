const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();
const dbops = require('../dbops');
const localauth = require('../localauth');
const renderWithDefaults = require('../common').renderWithDefaults;

/* GET home page. */
router.get('/', function(req, res, next) {
  let t = {
    login_status: 'Not logged-in',
    user: 'None',
  };

  if (req.user != undefined) {
    t.login_status = 'Logged-in as ' + req.user.username;
  }

  console.log(req.user);

  renderWithDefaults(req, res, 'index', t);
});

router.get('/register', function(req, res) {
  renderWithDefaults(req, res, 'register');
});

router.get('/login', function(req, res) {
  renderWithDefaults(req, res, 'login');
});

async function login(req, res, next) {
  let params = {
    rplace: 'login',
    error_message: 'An unknown error has occurred.'
  };

  await localauth.passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) {
      params.error_message = 
        'Podany użytkownik nie istnieje, bądź hasło jest nieprawidłowe.';
      res.render('registration_failed', params);
    }
    req.logIn(user, (err) => {
      if (err) {
        console.log('Error', err);
        return next(err);
      }
      res.redirect('/');
    });
  })(req, res, next);
}

router.post('/login_user', login);

router.post('/register_user', async (req, res, next) => {
  console.log(req.body)
  let registration_status = await dbops.create_user(
    req.body.username, req.body.email, req.body.password
  );

  console.log(typeof(registration_status))

  if(typeof(registration_status) === 'string') {
    if (registration_status == "exists_username") {
      renderWithDefaults(req, res, 'registration_failed', {error_message: `Użytkownik ${req.body.username} już istnieje`, rplace: 'register'});
    } else if (registration_status == "exists_email") {
      renderWithDefaults(req, res, 'registration_failed', {error_message: `Na email ${req.body.email} założone zostało już konto`, rplace: 'register'});
    }
  } else {
    await login(req, res, next);
  }
});


module.exports = router;
