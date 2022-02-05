var mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    timestamp: {type: mongoose.Date, required: true},
    host_userid: {type: mongoose.Types.ObjectId, required: true},
    client_userid: {type: mongoose.Types.ObjectId, required: true},
    host_rating_stars: {type: mongoose.Number, required: false},
    client_rating_stars: {type: mongoose.Number, required: false},
    host_comment_reference: {type: mongoose.Types.ObjectId, required: false},
    client_comment_reference: {type: mongoose.Types.ObjectId, required: false},
    host_response_reference: {type: mongoose.Types.ObjectId, required: false},
    client_response_reference: {type: mongoose.Types.ObjectId, required: false}
});

const CommentSchema = new mongoose.Schema({
    timestamp: {type: mongoose.Date, required: true},
    author: {type: mongoose.Types.ObjectId, required: true},
    comment_contents: {type: String, required: false},
    resource_uri: {type: String, required: false},
});

const UserSchema = new mongoose.Schema({
    timestamp: {type: mongoose.Date, required: true},
    username: {type: String, required: true},
    email: {type: String, required: true},
    pwdhash: {type: String, required: true},
    pfp_uri: {type: String, required: false},
    user_quote: {type: String, required: false},
    user_long_description: {type: String, required: false},
});

exports.InteractionSchema = InteractionSchema;
exports.CommentSchema = CommentSchema;
exports.UserSchema = UserSchema;