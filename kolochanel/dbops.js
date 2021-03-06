var mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb://localhost:27017/kolo');
const { User, Toilet, Comment, Interaction, Match, SleepyRequest, SleepyRequestSchema} = require('./schemas');


function hashPwd(pwd) {
  return bcrypt.hash(pwd, 10);
}

// check if user can be created
// if not, return null
// if can, return userid.
async function create_user(username, email, passwd) {
  let ex_users_by_username = await User.findOne({ username: username });

  if (ex_users_by_username != null)
    return 'exists_username';

  let ex_users_by_email = await User.findOne({
    email: email,
  });

  if (ex_users_by_email != null)
    return 'exists_email';

  let pwdhash = await hashPwd(passwd);

  let new_user = new User({
    timestamp: new Date().getTime(),
    username: username,
    email: email,
    pwdhash: pwdhash
  });

  console.log('SAVING USER!');
  await new_user.save();
  return new_user._id;
}

async function login_user(username, passwd) {
  let existing_user = await User.findOne({ username: username });

  console.log(existing_user)
  if (existing_user == null)
    return 'no_account';

  try {
    if (!(await bcrypt.compare(passwd, existing_user.pwdhash)))
      return 'wrong_pwd';
  } catch (e) {
    console.log('Error comparing passwords:', e);
    return 'internal_error';
  }

  return existing_user._id;
}

async function getUserById(id) {
  return await User.findById(id);
}

async function get_userid_from_username(username) {
  let user = await User.findOne({ username: username });
  if (user != null)
    return user._id;

  if (username[0].toUpperCase() == username[0]) {//pierwszy znak to upper case
    let newname = username[0].toLowerCase() + username.substring(1);
    user = await User.findOne({ username: newname });
    if (user != null)
      return user._id;
  }

  if (username[0].toLowerCase() == username[0]) {//pierwszy znak to lower case
    let newname = username[0].toUpperCase() + username.substring(1);
    user = await User.findOne({ username: newname });
    if (user != null)
      return user._id;
  }

  return "no_such_user"
}

async function get_userdata(userid) {
  let user = await User.findOne({ _id: userid })
  return user
}

async function change_bio(userid, new_bio) {
  let user = await User.findById(userid);
  user.user_quote = new_bio;
  await User.findByIdAndUpdate(userid, user);
}

async function update_pfp(userid, pfp_uri) {
  let user = await User.findById(userid);
  user.pfp_uri = pfp_uri;
  await User.findByIdAndUpdate(userid, user);
}

async function change_desc(userid, new_desc) {
  let user = await User.findById(userid);
  user.user_long_description = new_desc;
  await User.findByIdAndUpdate(userid, user);
}

async function register_matchresult(token, decision) {
  let matching = await Match.findOne({validation_token: token});
  matching.decision = (decision == 'true');
  matching.ranked = true
  console.log(matching)
  await Match.findByIdAndUpdate(matching._id, matching);
  return matching;
}

async function produce_matches(userid) {
  let toilets = await Toilet.find({})
  let used_toilets = new Set()
  let umatches = await Match.find({proposed_client: userid, ranked: true})
  for(let m of umatches)
    used_toilets.add(String(m.proposed_toilet._id))

  for(let t of toilets)
    if(!used_toilets.has(String(t._id))) {
      let towner = await get_owner_of_toilet(t._id);
      if(towner) {
        if(String(towner._id) != String(userid)) {
          let m = new Match({
            proposed_client: userid,
            proposed_toilet: t._id,
            validation_token: mongoose.Types.ObjectId(),
            ranked: false
          })

          await m.save();
        }
      }
    }
}

async function pop_sleepy_request(clientid, hostid) {
  await SleepyRequest.findOneAndDelete({proposed_client: clientid, proposed_host: hostid})
}

async function get_sleepy_requests_for_userid(userid) {
  let reqs = await SleepyRequest.find({proposed_host: userid})
  return reqs;
}

async function add_sleepy_request(host_userid, client_userid) {
  let req = await SleepyRequest.findOne({proposed_client: client_userid, proposed_host: host_userid})
  if (req != null)
    return;
  
  req = new SleepyRequest({
    proposed_client: client_userid,
    proposed_host: host_userid,
  })

  await req.save();
}

async function get_available_matches(username) {
  let userid = await get_userid_from_username(username)
  let matches = await Match.find({proposed_client: userid, ranked: false})
  if (matches.length > 0) {
    let ranmatches = matches.sort((a, b) => a._id > b._id);
    return ranmatches
  }
  
  await produce_matches(userid)
  
  matches = await Match.find({proposed_client: userid, ranked: false})
  if (matches.length > 0) {
    let ranmatches = matches.sort((a, b) => a._id > b._id);
    return ranmatches
  }
  
  return []
}

async function produce_matches_for_all() {
  let users = await User.find({})
  for (let u of users) {
    let m = await get_available_matches(u.username)
    console.log("produced ", m.length, " matches for ", u.username)
  }  
}


async function get_owner_of_toilet(toiletid) {
  let user = await User.findOne({$or: [
    {toiletID_1: toiletid}, 
    {toiletID_2: toiletid}, 
    {toiletID_3: toiletid}
  ]});

  return user
}


async function get_toiletdata(toiletid) {
  let toilet = await Toilet.findById(toiletid)
  return toilet
}

async function add_toiletimage(toiletdata, final_fname) {
  let toilet = await Toilet.findById(toiletdata)

  for (let i of ["1", "2", "3", "4", "5", "6"]) {
    let t = "toiletimage_uri_" + i;
    console.log(toilet[t])
    if (!toilet[t]) {
      toilet[t] = final_fname;
      await Toilet.findByIdAndUpdate(toiletdata, toilet)
      break
    }
  }
}

async function kill_toilet(userid, toilet_enum) {
  let userdata = await get_userdata(userid)
  if (toilet_enum == '1') { userdata.toiletID_1 = userdata.toiletID_2; userdata.toiletID_2 = userdata.toiletID_3; userdata.toiletID_3 = null; }
  if (toilet_enum == '2') { userdata.toiletID_2 = userdata.toiletID_3; userdata.toiletID_3 = null; }
  if (toilet_enum == '3') { userdata.toiletID_3 = null; }

  await User.findByIdAndUpdate(userid, userdata);
}

async function update_toilet(userid, toilet_enum, toilet_name, toilet_desc, toilet_gps_lat, toilet_gps_lon) {
  let userdata = await get_userdata(userid)
  let toiletdata = null;
  if (toilet_enum == '1') toiletdata = await get_toiletdata(userdata.toiletID_1);
  if (toilet_enum == '2') toiletdata = await get_toiletdata(userdata.toiletID_2);
  if (toilet_enum == '3') toiletdata = await get_toiletdata(userdata.toiletID_3);

  toiletdata.toiletname = toilet_name;
  toiletdata.toiletdesc = toilet_desc;
  toiletdata.toiletname = toilet_name;
  toiletdata.gps_lat = new mongoose.Types.Decimal128((+toilet_gps_lat.toString()).toFixed(4)),
    toiletdata.gps_lon = new mongoose.Types.Decimal128((+toilet_gps_lon.toString()).toFixed(4)),

    await toiletdata.save()
}


async function kill_toilet_image(userid, toilettarget, imtarget) {
  let userdata = await get_userdata(userid)
  let targettoiletdata = null;

  if (toilettarget == '1') targettoiletdata = await get_toiletdata(userdata.toiletID_1);
  if (toilettarget == '2') targettoiletdata = await get_toiletdata(userdata.toiletID_2);
  if (toilettarget == '3') targettoiletdata = await get_toiletdata(userdata.toiletID_3);

  // mam id toalety w toilettarget.
  let toiletdata = await get_toiletdata(targettoiletdata);
  console.log(toiletdata)
  let t = "toiletimage_uri_" + imtarget;
  toiletdata[t] = null;
  console.log("killing", t)
  console.log("resulting toiletdata is", toiletdata)

  for (let i of ["1", "2", "3", "4", "5"]) {
    let t = "toiletimage_uri_" + i;
    let tn = "toiletimage_uri_" + (parseInt(i, 10) + 1);
    if (toiletdata[tn] != null && toiletdata[t] == null) {
      toiletdata[t] = toiletdata[tn];
      toiletdata[tn] = null
    }
  }

  await Toilet.findByIdAndUpdate(targettoiletdata, toiletdata)
}

async function add_toilet_instance(userid, toilet_name, toilet_desc, toilet_lat, toilet_lon) {
  console.log("adding toilet instance!")
  let user = await User.findById(userid);
  let toilet = new Toilet({
    timestamp: new Date().getTime(),
    toiletname: toilet_name,
    toiletdesc: toilet_desc,
    gps_lat: new mongoose.Types.Decimal128((+toilet_lat.toString()).toFixed(4)),
    gps_lon: new mongoose.Types.Decimal128((+toilet_lon.toString()).toFixed(4))
  });

  await toilet.save();

  if (!user.toiletID_1) { user.toiletID_1 = toilet._id; await User.findByIdAndUpdate(userid, user); return; }
  if (!user.toiletID_2) { user.toiletID_2 = toilet._id; await User.findByIdAndUpdate(userid, user); return; }
  if (!user.toiletID_3) { user.toiletID_3 = toilet._id; await User.findByIdAndUpdate(userid, user); return; }
  console.log("CRITICAL, TOILET QUOTA EXCEEDED FOR", user._id);
}

async function make_comment(author, contents, resource_uri) {
  console.log("adding comment!")
  let comment = new Comment({
    timestamp: new Date().getTime(),
    author: author,
    comment_contents: contents,
    resource_uri: resource_uri
  });

  await comment.save();
  console.log("created comment with id=", comment._id);
  return comment._id;
}

async function rank_all_users() {
  console.log("recalculating all ranks...");
  let users = await User.find({});
  for (let user of users) {
    await rank_user(user._id);
  }
}

async function rank_user(target_userid) {
  let rating_sum = 0;
  let rating_count = 0;
  let marks = [];

  let interactions = await Interaction.find({client_userid: target_userid});
  for (let i of interactions)
    if(i.host_rating_stars) {
      rating_sum += i.host_rating_stars;
      marks.push(i.host_rating_stars);
      rating_count += 1;
    }

  interactions = await Interaction.find({host_userid: target_userid});
  for (let i of interactions)
    if(i.client_rating_stars) {
      rating_sum += i.client_rating_stars;
      marks.push(i.client_rating_stars);
      rating_count += 1;
    }

  let user = await User.findById(target_userid);

  if (rating_count == 0) {
    console.log(target_userid + " has no ranks, will set to 5")    
    user.user_rating = 5.0;
  } else {
    user.user_rating = rating_sum / rating_count;
    console.log(target_userid + " has score of " + user.user_rating + "from marks: " + marks)    
    
  }
  
  await user.save();
}

async function rate_interaction(intent, interaction_id, rating) {
  let interaction = await Interaction.findById(interaction_id)
  if(intent == "client_comments") {
    interaction.client_rating_stars = rating;
  }
  
  if(intent == "host_comments") {
    interaction.host_rating_stars = rating;
  }

  await Interaction.findByIdAndUpdate(interaction_id, interaction);
  if(intent == "client_comments") {await rank_user(interaction.host_userid);}
  if(intent == "host_comments") {await rank_user(interaction.client_userid);}
}

async function create_interaction(host_userid, client_userid) {
  let i = new Interaction({
    timestamp: new Date().getTime(),
    host_userid: host_userid,
    client_userid: client_userid
  })

  await i.save();
}

async function link_comment(comment_id, intent, interaction_id) {
  let interaction = await Interaction.findById(interaction_id)

  if (intent == "host_comments") {
    console.log("linking comment", comment_id, " to interaction ", interaction_id)
    interaction.host_comment_reference = comment_id;
  }

  if (intent == "client_comments") {
    console.log("linking comment", comment_id, " to interaction ", interaction_id)
    interaction.client_comment_reference = comment_id;
  }

  if (intent == "host_responds") {
    console.log("linking comment", comment_id, " to interaction ", interaction_id)
    interaction.host_response_reference = comment_id;
  }

  if (intent == "client_responds") {
    console.log("linking comment", comment_id, " to interaction ", interaction_id)
    interaction.client_response_reference = comment_id;
  }


  await Interaction.findByIdAndUpdate(
    interaction_id, interaction
  );
}

exports.create_user = create_user;
exports.login_user = login_user;
exports.getUserById = getUserById;
exports.get_userid_from_username = get_userid_from_username;
exports.get_userdata = get_userdata;
exports.get_toiletdata = get_toiletdata;
exports.add_toiletimage = add_toiletimage;
exports.change_bio = change_bio;
exports.change_desc = change_desc;
exports.add_toilet_instance = add_toilet_instance;
exports.kill_toilet_image = kill_toilet_image;
exports.kill_toilet = kill_toilet;
exports.update_toilet = update_toilet;
exports.make_comment = make_comment;
exports.link_comment = link_comment;
exports.rate_interaction = rate_interaction;
exports.get_owner_of_toilet = get_owner_of_toilet;
exports.get_available_matches = get_available_matches;
exports.register_matchresult = register_matchresult;
exports.add_sleepy_request = add_sleepy_request;
exports.get_sleepy_requests_for_userid = get_sleepy_requests_for_userid;
exports.pop_sleepy_request = pop_sleepy_request;
exports.create_interaction = create_interaction;
exports.update_pfp = update_pfp;
exports.rank_all_users = rank_all_users;
exports.produce_matches_for_all = produce_matches_for_all;