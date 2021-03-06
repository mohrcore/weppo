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
    user_rating: {type: Number, required: false},
    email: {type: String, required: true},
    pwdhash: {type: String, required: true},
    pfp_uri: {type: String, required: false},
    user_quote: {type: String, required: false},
    user_long_description: {type: String, required: false},
    toiletID_1: {type: mongoose.Types.ObjectId, required: false},
    toiletID_2: {type: mongoose.Types.ObjectId, required: false},
    toiletID_3: {type: mongoose.Types.ObjectId, required: false},
});

const ToiletSchema = new mongoose.Schema({
    timestamp: {type: mongoose.Date, required: true},
    toiletname: {type: String, required: true},
    toiletdesc: {type: String, required: false},
    gps_lat: {type: mongoose.Types.Decimal128, required: false},
    gps_lon: {type: mongoose.Types.Decimal128, required: false},
    toiletimage_uri_1: {type: String, required: false},
    toiletimage_uri_2: {type: String, required: false},
    toiletimage_uri_3: {type: String, required: false},
    toiletimage_uri_4: {type: String, required: false},
    toiletimage_uri_5: {type: String, required: false},
    toiletimage_uri_6: {type: String, required: false},
});

const MatchMakerSchema = new mongoose.Schema({
    proposed_client:  {type: mongoose.Types.ObjectId, required: true},
    proposed_toilet:  {type: mongoose.Types.ObjectId, required: true},
    validation_token:  {type: mongoose.Types.ObjectId, required: true},
    ranked:  {type: Boolean, required: true},
    result:  {type: Boolean, required: false},
});

const SleepyRequestSchema = new mongoose.Schema({
    proposed_client:  {type: mongoose.Types.ObjectId, required: true},
    proposed_host:  {type: mongoose.Types.ObjectId, required: true},
});

exports.SleepyRequestSchema = SleepyRequestSchema;
exports.InteractionSchema = InteractionSchema;
exports.CommentSchema = CommentSchema;
exports.UserSchema = UserSchema;
exports.ToiletSchema = ToiletSchema;
exports.MatchMakerSchema = MatchMakerSchema;

const User = mongoose.model('users', UserSchema);
const Toilet = mongoose.model('toilets', ToiletSchema);
const Comment = mongoose.model('comments', CommentSchema);
const Interaction = mongoose.model('interactions', InteractionSchema);
const Match = mongoose.model('matchmaker', MatchMakerSchema);
const SleepyRequest = mongoose.model('sleepy_requests', SleepyRequestSchema);

exports.User = User;
exports.Toilet = Toilet;
exports.Comment = Comment;
exports.Interaction = Interaction;
exports.Match = Match;
exports.SleepyRequest = SleepyRequest;