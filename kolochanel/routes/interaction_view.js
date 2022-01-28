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

const Interaction = mongoose.model('interactions', InteractionSchema);;

/* GET home page. */
router.get('/', function(req, res, next) {
    Interaction.find().then(
        interactions => {
            let sorted_interactions = interactions.sort((a, b) => a.timestamp > b.timestamp);
            console.log(sorted_interactions);
            res.render('interaction', { title: 'Express' , interactions: sorted_interactions});
        })
});

module.exports = router;
