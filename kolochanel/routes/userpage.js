var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const { get_userid_from_username, get_userdata, get_toiletdata, add_toiletimage } = require('../dbops');
const { get_and_squash_interaction_query, get_interactions } = require('./interaction_view')
mongoose.connect('mongodb://localhost:27017/kolo');
const Schemas = require('../schemas');
const Interaction = mongoose.model('interactions', Schemas.InteractionSchema);
const Comment = mongoose.model('comments', Schemas.CommentSchema);
const User = mongoose.model('users', Schemas.UserSchema)
const multer  = require('multer')
const upload = multer({ dest: 'public/images/' })
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

router.get('/', async(req, res, next) => {
    res.render('user_page', {});
});

function massage_shitterimages(toilet_ref) {
    built_toiletmap = []
    for(let i in ["1", "2", "3", "4", "5", "6"]) {
        let t = "toiletimage_uri_" + i;
        if (toilet_ref[t])
            built_toiletmap.push(toilet_ref[t])
    }

    if(built_toiletmap.length < 6)
        built_toiletmap.push("add_new")


    while(built_toiletmap.length < 6)
        built_toiletmap.push("empty")

    return {
        toiletname: toilet_ref.toiletname,
        toiletimages: built_toiletmap
    }
}

router.post('/addimage/username/:username/toiletgroup/:toiletgroup', upload.single('toiletimage'), async (req, res, next) => {
    console.log(req.params)
    console.log(req.file)
    let fpath = '/images/resized' + req.file.filename
    let rpath = path.resolve(req.file.destination,'resized' + req.file.filename)
    await sharp(req.file.path).resize(256, 256).jpeg({ quality: 90 }).toFile(rpath)
    fs.unlinkSync(req.file.path)

    console.log()
    // dostałem req.file
    let user_id = await get_userid_from_username(req.params.username);
    let userdata = await get_userdata(user_id)
    let toiletdata = null
    if (req.params.toiletgroup == '1') toiletdata = userdata.toiletID_1;
    if (req.params.toiletgroup == '2') toiletdata = userdata.toiletID_2;
    if (req.params.toiletgroup == '3') toiletdata = userdata.toiletID_3;
    
    // mam już id na opis toalety, mam id obrazka (req.file.filename)
    await add_toiletimage(toiletdata, fpath)
    // wiem że muszę go dopisać do username -> toiletgroup.

    // wróć na stronę profilową.
    res.redirect("/userpage/username/" + req.params.username)
})

/* GET home page. */
router.get('/username/:username', async(req, res, next) => {
    let user_id = await get_userid_from_username(req.params.username);
    let userdata = await get_userdata(user_id)
    let t1_ref = await userdata.toiletID_1 ? await get_toiletdata(userdata.toiletID_1) : "None";
    let t2_ref = await userdata.toiletID_2 ? await get_toiletdata(userdata.toiletID_2) : "None";
    let t3_ref = await userdata.toiletID_3 ? await get_toiletdata(userdata.toiletID_3) : "None";

    let query_hint = {$or: [{client_userid: user_id}, {host_userid: user_id}]};
    let inter_query = await get_and_squash_interaction_query(query_hint)
    inter_query = await get_interactions(inter_query, res)
    
    pagedata = {
        username: req.params.username,
        user_quote: userdata.user_quote ? userdata.user_quote : "użytkownik nie napisał nic o sobie",
        user_long_description: userdata.user_long_description ? userdata.user_long_description : "",
        pfp_uri: userdata.pfp_uri,
        t1_ref: massage_shitterimages(t1_ref),
        t2_ref: massage_shitterimages(t2_ref),
        t3_ref: massage_shitterimages(t3_ref),
        interaction_query: inter_query,
        interactive_page: true,
    }

    console.log(pagedata)
  
    res.render('user_page', pagedata);
});

module.exports = router;