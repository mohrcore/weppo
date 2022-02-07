var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const { update_toilet, kill_toilet, kill_toilet_image, add_toilet_instance, get_userid_from_username, get_userdata, get_toiletdata, add_toiletimage, change_bio, change_desc } = require('../dbops');
const { get_and_squash_interaction_query, get_interactions } = require('./interaction_view')
mongoose.connect('mongodb://localhost:27017/kolo');
const multer  = require('multer')
const upload = multer({ dest: 'public/images/' })
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const renderWithDefaults = require('../common').renderWithDefaults;

function massage_shitterimages(toilet_ref) {
    if (toilet_ref == "None" || toilet_ref == "Invite") {
        return toilet_ref
    }

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
        toiletdesc: toilet_ref.toiletdesc ? toilet_ref.toiletdesc : "None",
        gps_lat: toilet_ref.gps_lat ? toilet_ref.gps_lat : "None",
        gps_lon: toilet_ref.gps_lon ? toilet_ref.gps_lon : "None",
        toiletimages: built_toiletmap,
    }
}

router.post('/addimage/username/:username/toiletgroup/:toiletgroup', upload.single('toiletimage'), async (req, res, next) => {
    console.log(req.params)
    console.log(req.file)
    let fpath = '/images/dyn/toilets/resized' + req.file.filename
    let rpath = path.resolve(req.file.destination, 'dyn/toilets/resized' + req.file.filename)
    await sharp(req.file.path).resize(256, 256).jpeg({ quality: 90 }).toFile(rpath)
    fs.unlinkSync(req.file.path)

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

router.post('/killimage/username/:username', async (req, res, next) => {
    console.log(req.params, req.body)
    let user_id = await get_userid_from_username(req.params.username);
    await kill_toilet_image(user_id, req.body.killimage_boxtarget, req.body.killimage_imtarget)
    res.redirect("/userpage/username/" + req.params.username)
})

router.post('/change_profile_text/username/:username', async (req, res, next) => {
    console.log(req.params, req.body)
    let user_id = await get_userid_from_username(req.params.username);
    // zrób to co trzeba
    if(req.body.bio_input) await change_bio(user_id, req.body.bio_input)
    if(req.body.desc_input) await change_desc(user_id, req.body.desc_input)

    // wróć na profil
    res.redirect("/userpage/username/" + req.params.username)
})

router.post('/addshitter/username/:username', async (req, res, next) => {
    console.log(req.params, req.body)
    let user_id = await get_userid_from_username(req.params.username);
    await add_toilet_instance(
        user_id, 
        req.body.toilet_name, 
        req.body.toilet_desc, 
        req.body.toilet_GPS_lat, 
        req.body.toilet_GPS_lon
    );
    // wróć na profil
    res.redirect("/userpage/username/" + req.params.username)
})

router.post('/modtoilet/username/:username', async (req, res, next) => {
    console.log("in endpoint modtoilet with", req.params, req.body)

    let user_id = await get_userid_from_username(req.params.username);

    if(req.body.modtoilet_kill && req.body.modtoilet_kill == "True") {
        await kill_toilet(user_id, req.body.modtoilet_target);
        res.redirect("/userpage/username/" + req.params.username)
    }

    await update_toilet(
        user_id, 
        req.body.modtoilet_target,
        req.body.modtoilet_name,
        req.body.modtoilet_desc,
        req.body.modtoilet_gps_lat,
        req.body.modtoilet_gps_lon,
    );
    // wróć na profil
    res.redirect("/userpage/username/" + req.params.username)
})


/* GET home page. */
router.get('/username/:username', async(req, res, next) => {
    if(req.params.username == 'undefined')
        return // some weirdness goind on.

    let user_id = await get_userid_from_username(req.params.username);
    let userdata = await get_userdata(user_id)
    let t1_ref = await userdata.toiletID_1 ? await get_toiletdata(userdata.toiletID_1) : "None";
    let t2_ref = await userdata.toiletID_2 ? await get_toiletdata(userdata.toiletID_2) : "None";
    let t3_ref = await userdata.toiletID_3 ? await get_toiletdata(userdata.toiletID_3) : "None";

    let query_hint = {$or: [{client_userid: user_id}, {host_userid: user_id}]};
    let inter_query = await get_and_squash_interaction_query(query_hint)
    inter_query = await get_interactions(inter_query, res)

    if(t1_ref == "None") {t1_ref = "Invite"; t2_ref = "None"; t3_ref = "None";} else
    if(t2_ref == "None") {t2_ref = "Invite"; t3_ref = "None";} else
    if(t3_ref == "None") {t3_ref = "Invite";}

    let authed_user = false;
    let authorized_actor = "nikt"
    if (req.user && (req.user.username == req.params.username)) {
        authed_user = true;
        authorized_actor = String(user_id);
    }

    let logged_user = "None"
    if (req.user && req.user.username) {
        logged_user = req.user.username;
    }

    pagedata = {
      username: req.params.username,
      logged_user: logged_user,
      user_quote: userdata.user_quote ? userdata.user_quote : "użytkownik nie napisał nic o sobie",
      user_long_description: userdata.user_long_description ? userdata.user_long_description : "",
      pfp_uri: userdata.pfp_uri,
      t1_ref: massage_shitterimages(t1_ref),
      t2_ref: massage_shitterimages(t2_ref),
      t3_ref: massage_shitterimages(t3_ref),
      interaction_query: inter_query,
      interactive_page: authed_user,
      authorized_actor: authorized_actor,
    }

    console.log(pagedata)
    renderWithDefaults(req, res, 'user_page', pagedata);
});

module.exports = router;