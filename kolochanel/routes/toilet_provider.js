var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const { create_interaction, pop_sleepy_request, get_sleepy_requests_for_userid, add_sleepy_request, register_matchresult, get_toiletdata, get_owner_of_toilet, get_userdata, get_available_matches, get_userid_from_username } = require('../dbops')

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

  while (toiletimages.length < 6)
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
router.get('/get_toilet/username/:username', async function (req, res, next) {
  let matches = await get_available_matches(req.params.username)
  if (matches.length > 0) {
    let payload = await get_payload_for_toiletid(matches[0].proposed_toilet, matches[0].validation_token);
    res.send(JSON.stringify(payload))
  } else {
    res.send(JSON.stringify({ done: "done" }))
  }
});

router.post('/submit_result', async function (req, res, next) {
  let match = await register_matchresult(
    req.body.form_token, req.body.form_decision
  )

  if (req.body.form_decision == 'true') {
    await add_sleepy_request(
      await get_owner_of_toilet(match.proposed_toilet),
      match.proposed_client,
    )
  }

  res.status(204).send();
});

router.post('/submit_request', async function (req, res, next) {
  await pop_sleepy_request(
    req.body.form_client_userid,
    req.body.form_host_userid
  );

  if(req.body.form_meetup_decision == 'true') {
    await create_interaction(
      req.body.form_host_userid,
      req.body.form_client_userid,
    )
  }

  res.status(204).send();
});


router.get('/get_requests/username/:username', async function (req, res, next) {
  let userid = await get_userid_from_username(req.params.username);
  let requests = await get_sleepy_requests_for_userid(userid)

  if (requests.length > 0) {
    let request = requests[0];
    let client_userid = request.proposed_client;
    let client_data = await get_userdata(client_userid);
    res.send(JSON.stringify({
      eeee: "AAAAAAAAAAAAA",
      client_userid: client_userid,
      client_username: client_data.username,
      client_pfp: client_data.pfp_uri,
      host_userid: userid
    }))
  } else {
    res.send(JSON.stringify({ done: "done" }))
  }
});



module.exports = router;
