var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const { get_userid_from_username } = require('../dbops');

mongoose.connect('mongodb://localhost:27017/kolo');
const Schemas = require('../schemas');
const Interaction = mongoose.model('interactions', Schemas.InteractionSchema);
const Comment = mongoose.model('comments', Schemas.CommentSchema);
const User = mongoose.model('users', Schemas.UserSchema)
// take a hint for mongoose query
// return array of
// - interactions - interactions list (objects same as InteractionSchema)
// - required_comments - dictionary from comment id to none (to be fetched later)
// - required_responses - dictionary from response id to none (to be fetched later)

function prettyfy_timestamp(timestamp) {
  let d = timestamp.toISOString().split('T');
  return d[0] + ' o ' + d[1].slice(0, -1).split('.')[0]; 
}

async function get_and_squash_interaction_query(interaction_hint) {
  let p_interactions = [];
  let required_comments = {};
  let required_users = {};

  let rinteractions = await Interaction.find(interaction_hint);
  let interactions = rinteractions.sort((a, b) => a.timestamp > b.timestamp);
  for (let interaction of interactions) {
    p_interactions.push({
      _id: interaction._id,
      host_userid: interaction.host_userid ? interaction.host_userid : 'None',
      client_userid: interaction.client_userid ? interaction.client_userid : 'None',
      client_comment_reference: interaction.client_comment_reference ? interaction.client_comment_reference : 'None',
      host_comment_reference: interaction.host_comment_reference ? interaction.host_comment_reference : 'None',
      timestamp: interaction.timestamp ? prettyfy_timestamp(interaction.timestamp): 'None',
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

      if (interaction.host_userid)
        required_users[interaction.host_userid] = null;

      if (interaction.client_userid)
        required_users[interaction.client_userid] = null;
    }

  return {
    prepared_interactions: p_interactions,
    comment_map: required_comments,
    user_map: required_users,
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
      timestamp: c.timestamp ? prettyfy_timestamp(c.timestamp): 'None',
      resource_uri: c.resource_uri ? c.resource_uri : 'None',
    };
  }

  commentmap['None'] = 'None';
  return { comment_map: commentmap };
}

async function get_and_squash_user_query(user_mapping) {
  let users = await User.find({})
  let user_map = {}

  for (let u of users) {
    user_map[u._id] = {
      username: u.username ? u.username : "None",
      pfp_uri: u.pfp_uri ? u.pfp_uri : "None",
    }
  }

  user_map['None'] = 'None';

  return {user_map: user_map};
}

async function get_interactions(inter_query, res) {
  let comm_query = await get_and_squash_comment_query(inter_query.comment_map)
  inter_query.comment_map = comm_query.comment_map;
  let user_query = await get_and_squash_user_query(inter_query.user_map)
  inter_query.user_map = user_query.user_map;

  console.log(inter_query); // TODO: odpytaj DB tylko o to co potrzeba.
  res.render(
    'interaction_top', 
    { interaction_descriptor: inter_query }
  );

}

router.get('/', async(req, res, next) => {
  let inter_query = await get_and_squash_interaction_query({})
  get_interactions(inter_query, res)
});

/* GET home page. */
router.get('/username/:username/actor_type/:actor_type', async(req, res, next) => {
  let user_id = await get_userid_from_username(req.params.username);
  interaction_hint = []

  if (req.params.actor_type == "both" || req.params.actor_type == "client") {
    interaction_hint.push({client_userid: user_id})
  }

  if (req.params.actor_type == "both" || req.params.actor_type == "host") {
    interaction_hint.push({host_userid: user_id})    
  }

  let inter_query = await get_and_squash_interaction_query({$or: interaction_hint})
  get_interactions(inter_query, res)
});

module.exports = router;
