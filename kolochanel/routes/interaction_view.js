var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/kolo');
const Schemas = require('../schemas');
const Interaction = mongoose.model('interactions', Schemas.InteractionSchema);
const Comment = mongoose.model('comments', Schemas.CommentSchema);

// take a hint for mongoose query
// return array of
// - interactions - interactions list (objects same as InteractionSchema)
// - required_comments - dictionary from comment id to none (to be fetched later)
// - required_responses - dictionary from response id to none (to be fetched later)
async function get_and_squash_interaction_query(interaction_hint) {
  let p_interactions = [];
  let required_comments = {};
  let required_responses = {};

  let rinteractions = await Interaction.find(interaction_hint);
  let interactions = rinteractions.sort((a, b) => a.timestamp > b.timestamp);
  for (let interaction of interactions) {
    p_interactions.push({
      _id: interaction._id,
      client_comment_reference: interaction.client_comment_reference ? interaction.client_comment_reference : 'None',
      host_comment_reference: interaction.host_comment_reference ? interaction.host_comment_reference : 'None',
      timestamp: interaction.timestamp ? interaction.timestamp : 'None',
      client_userid: interaction.client_userid ? interaction.client_userid : 'None',
      host_userid: interaction.host_userid ? interaction.host_userid : 'None',
      host_response_reference: interaction.host_response_reference ? interaction.host_response_reference : 'None',
      client_response_reference: interaction.client_response_reference ? interaction.client_response_reference : 'None',
    })

    if (interaction.client_comment_reference)
      required_comments[interaction.client_comment_reference] = null;

    if (interaction.host_comment_reference)
      required_comments[interaction.host_comment_reference] = null;
    
    if (interaction.client_response_reference)
      required_comments[interaction.client_response_reference] = null;

    if (interaction.host_response_reference)
      required_comments[interaction.host_response_reference] = null;
    }
  
  return {
    prepared_interactions: p_interactions,
    comment_map: required_comments,
    response_map: required_responses,
  };
}

// take the mapping for comment uuids
// return array of
// - comment_map - filled out comment mapping
async function get_and_squash_comment_query(comment_mapping) {
  let comments = await Comment.find({}); // TODO: query only required
  let commentmap = {};

  for(let c of comments) {
    commentmap[c._id] = {
      content: c.comment_contents ? c.comment_contents : 'None',
      author: c.author ? c.author : 'None',
      timestamp: c.timestamp ? c.timestamp : 'None',
      resource_uri: c.resource_uri ? c.resource_uri : 'None',
    };
  }

  commentmap['None'] = 'None';
  return { comment_map: commentmap };
}

/* GET home page. */
router.get('/', async(req, res, next) => {
    let inter_query = await get_and_squash_interaction_query({})
    let comm_query = await get_and_squash_comment_query(inter_query.comment_map);
    inter_query.comment_map = comm_query.comment_map;

    console.log(inter_query); // TODO: odpytaj DB tylko o to co potrzeba.
    res.render(
      'interaction', 
      { interaction_descriptor: inter_query }
    );
});

module.exports = router;
