var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/kolo')
const Schemas = require('./schemas')
const User = mongoose.model('users', Schemas.UserSchema)
// check if user can be created
// if not, return null
// if can, return userid.
async function create_user(username, email, passwd) {
    let ex_users_by_username = await User.findOne({
        username: username,
    });

    if (ex_users_by_username != null)
        return "exists_username"

    let ex_users_by_email = await User.findOne({
        email: email,
    });

    if (ex_users_by_email != null)
        return "exists_email"

    let new_user = new User({
        timestamp: new Date().getTime(),
        username: username,
        email: email,
        password: passwd
    })
    
    console.log("SAVING USER!")
    await new_user.save()
    return new_user._id;
}

exports.create_user = create_user