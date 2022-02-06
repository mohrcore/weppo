var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const {get_toiletdata, get_owner_of_toilet, get_userdata} = require('../dbops')

async function get_payload_for_toiletid(toiletid) {
  let toiletdata = await get_toiletdata(toiletid)
  let userid = await get_owner_of_toilet(toiletid);
  let userdata = await get_userdata(userid)
  let toiletimages = []
  for (let i of ["1", "2", "3", "4", "5", "6"]) {
    if (toiletdata['toiletimage_uri_' + i]) {
      toiletimages.push(toiletdata['toiletimage_uri_' + i])
    }
  }

  while(built_toiletmap.length < 6)
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
    toilet_images: toiletimages
  }

  return payload;
}

/* GET users listing. */
router.get('/get_toilet', async function(req, res, next) {
  console.log(res.user)
  console.log("endpoint_called!")

  let sampleid = mongoose.Types.ObjectId('61ffee0236ad9989cd626efa');
  let payload = await get_payload_for_toiletid(sampleid);
  res.send(JSON.stringify(payload))
});

module.exports = router;
