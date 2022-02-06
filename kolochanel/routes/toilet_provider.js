var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const {register_matchresult, get_toiletdata, get_owner_of_toilet, get_userdata, get_available_matches} = require('../dbops')

async function get_payload_for_toiletid(toiletid, token) {
  let toiletdata = await get_toiletdata(toiletid)
  let userid = await get_owner_of_toilet(toiletid);
  let userdata = await get_userdata(userid)
  let toiletimages = []
  for (let i of ["1", "2", "3", "4", "5", "6"]) {
    if (toiletdata['toiletimage_uri_' + i]) {
      toiletimages.push(toiletdata['toiletimage_uri_' + i])
    }
  }

  while(toiletimages.length < 6)
    toiletimages.push("/images/empty_box.jpg");


  let payload = {
    toiletid: toiletid,
    toiletname: toiletdata.toiletname,
    toiletdesc: toiletdata.toiletdesc,
    userid: String(userid),
    username: userdata.username,
    pfp_uri: userdata.pfp_uri,
    user_quote: userdata.user_quote,
    user_long_description: userdata.user_long_description,
    toilet_images: toiletimages,
    validation_token: token
  }

  return payload;
}

/* GET users listing. */
router.get('/get_toilet/username/:username', async function(req, res, next) {
  console.log(req.params)
  console.log("endpoint_called!")
  let matches = await get_available_matches(req.params.username)
  console.log(matches)
  console.log(matches[0])
  let payload = await get_payload_for_toiletid(matches[0].proposed_toilet, matches[0].validation_token);
  res.send(JSON.stringify(payload))
});

router.post('/submit_result', async function(req, res, next) {
  console.log("result submitted!", req.body)
  await register_matchresult(
    req.body.form_token, req.body.form_decision
  )
});


module.exports = router;
