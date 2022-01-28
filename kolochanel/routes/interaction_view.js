var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/kolo')

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

const Interaction = mongoose.model('interactions', InteractionSchema);

const CommentSchema = new mongoose.Schema({
    _id: mongoose.ObjectId,
    timestamp: {type: mongoose.Date, required: true},
    author: {type: mongoose.Types.ObjectId, required: true},
    comment_contents: {type: String, required: false},
    resource_uri: {type: String, required: false},
});

const Comment = mongoose.model('comments', CommentSchema);


/* GET home page. */
router.get('/', function(req, res, next) {
    Interaction.find().then(
        interactions => {
            let sorted_interactions_qrp = interactions.sort((a, b) => a.timestamp > b.timestamp);
            let sorted_interactions = []

            let required_comments = {}
            for (let inter of sorted_interactions_qrp) {
                sorted_interactions.push({
                    _id: inter._id,
                    client_comment_reference: inter.client_comment_reference ? inter.client_comment_reference : "None",
                    host_comment_reference: inter.host_comment_reference ? inter.host_comment_reference : "None",
                })

                if (inter.client_comment_reference)
                    required_comments[inter.client_comment_reference] = null

                if (inter.host_comment_reference)
                    required_comments[inter.host_comment_reference] = null
            } 
            
            console.log(required_comments) // TODO: odpytaj DB tylko o to co potrzeba.

            Comment.find().then(
                comments => {
                    let commentdict = {};
                    for (let c of comments) {
                        commentdict[c._id] = c.comment_contents ? c.comment_contents : "None" 
                    }
                    commentdict["None"] = "None"

                    console.log(commentdict)
                    res.render('interaction', 
                    { 
                        title: 'Express', 
                        interactions: sorted_interactions,
                        commentmap: commentdict
                    });
                })
        })
});

module.exports = router;
