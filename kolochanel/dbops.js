var mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb://localhost:27017/kolo');
const Schemas = require('./schemas');
const User = mongoose.model('users', Schemas.UserSchema);
const Toilet = mongoose.model('toilets', Schemas.ToiletSchema);

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

async function get_userid_from_username(username) {
  let user = await User.findOne({ username: username });
  return user._id;
}

async function get_userdata(userid) {
  let user = await User.findOne({_id: userid})
  return user
}

async function change_bio(userid, new_bio) {
  let user = await User.findById(userid);
  user.user_quote = new_bio;
  await User.findByIdAndUpdate(userid, user);
}

async function change_desc(userid, new_desc) {
  let user = await User.findById(userid);
  user.user_long_description = new_desc;
  await User.findByIdAndUpdate(userid, user);
}


async function get_toiletdata(toiletid) {
  let toilet = await Toilet.findById(toiletid)
  console.log(toilet)
  return toilet
}

async function add_toiletimage(toiletdata, final_fname) {
  let toilet = await Toilet.findById(toiletdata)

  for(let i of ["1", "2", "3", "4", "5", "6"]) {
    let t = "toiletimage_uri_" + i;
    console.log(toilet[t])
    if (!toilet[t]) {
      toilet[t] = final_fname;
      await Toilet.findByIdAndUpdate(toiletdata, toilet)
      break
    }
  }
}

async function add_toilet_instance(userid) {
  let user = await User.findById(userid);
  let toilet = new Toilet({
    timestamp: new Date().getTime(),
    toiletname: "temp"
  });

  await toilet.save();

  if(!user.toiletID_1) {user.toiletID_1 = toilet._id; await User.findByIdAndUpdate(userid, user); return;}
  if(!user.toiletID_2) {user.toiletID_2 = toilet._id; await User.findByIdAndUpdate(userid, user); return;}
  if(!user.toiletID_3) {user.toiletID_3 = toilet._id; await User.findByIdAndUpdate(userid, user); return;}
  console.log("CRITICAL, TOILET QUOTA EXCEEDED FOR", user._id);
}

exports.create_user = create_user;
exports.login_user = login_user;
exports.get_userid_from_username = get_userid_from_username;
exports.get_userdata = get_userdata;
exports.get_toiletdata = get_toiletdata;
exports.add_toiletimage = add_toiletimage;
exports.change_bio = change_bio;
exports.change_desc = change_desc;
exports.add_toilet_instance = add_toilet_instance;