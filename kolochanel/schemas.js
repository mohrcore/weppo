var mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    _id: mongoose.ObjectId,
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
    _id: mongoose.ObjectId,
    timestamp: {type: mongoose.Date, required: true},
    author: {type: mongoose.Types.ObjectId, required: true},
    comment_contents: {type: String, required: false},
    resource_uri: {type: String, required: false},
});

exports.InteractionSchema = InteractionSchema;
exports.CommentSchema = CommentSchema;