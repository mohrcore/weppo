var mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb://localhost:27017/kolo');
const Schemas = require('./schemas');
const User = mongoose.model('users', Schemas.UserSchema);

function hashPwd(pwd) {
    return bcrypt.hash(pwd, 10);
}

// check if user can be created
// if not, return null
// if can, return userid.
async function create_user(username, email, passwd) {
    let ex_users_by_username = await User.findOne({
        username: username,
    });

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

exports.create_user = create_user;
exports.login_user = login_user;