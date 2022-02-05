var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const { get_userid_from_username, get_userdata } = require('../dbops');

mongoose.connect('mongodb://localhost:27017/kolo');
const Schemas = require('../schemas');
const Interaction = mongoose.model('interactions', Schemas.InteractionSchema);
const Comment = mongoose.model('comments', Schemas.CommentSchema);
const User = mongoose.model('users', Schemas.UserSchema)

router.get('/', async(req, res, next) => {
    res.render('user_page', {});
});

/* GET home page. */
router.get('/username/:username', async(req, res, next) => {
    let user_id = await get_userid_from_username(req.params.username);
    let userdata = await get_userdata(user_id)
    console.log(userdata)
    res.render('user_page', 
    {
        username: req.params.username,
        user_quote: userdata.user_quote ? userdata.user_quote : "użytkownik nie napisał nic o sobie",
        user_long_description: userdata.user_long_description ? userdata.user_long_description : "",
        pfp_uri: userdata.pfp_uri
    });
});

module.exports = router;