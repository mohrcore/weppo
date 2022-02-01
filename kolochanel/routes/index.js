var express = require('express');
const { ObjectId } = require('mongodb');
var router = express.Router();
var dbops = require("../dbops")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/register', function(req, res) {
  res.render('register');
});

router.post('/register_user', async(req, res, next) => {
  let registration_status = await dbops.create_user(
    req.body.username, req.body.email, req.body.pwd
  );

  console.log(typeof(registration_status))

  if(typeof(registration_status) === 'string') {
    if (registration_status == "exists_username") {
      res.render('registration_failed', {error_message: `Użytkownik ${req.body.username} już istnieje`});
    } else if (registration_status == "exists_email") {
      res.render('registration_failed', {error_message: `Na email ${req.body.email} założone zostało już konto`});
    }
  } else {
    res.redirect('index');
  }
});


module.exports = router;
