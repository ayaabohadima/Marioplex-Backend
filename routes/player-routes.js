const middleTrack = "2";
const router = require('express').Router();
const Player =require('../public-api/player-api');
const User = require('../public-api/user-api');
const {auth:checkAuth} = require('../middlewares/isMe');

router.get('/updatePlayer/:id',async (req,res)=>{
    const user = await User.getUserById("5e6bcfec15da8934bc2114d5")
  const p =  await Player.setPlayerInstance(user,true,"5e713e741103df39508b20cf",req.params.id);
  if(!p) res.status(404).send({error:"wrong"});
  else res.json({"success":"updated user player"});
})


router.put('/createQueue/:playlist_id/:trackId',checkAuth,async (req,res)=>{
    
    const sourceId =req.params.playlist_id;
    const trackId =req.params.trackId;
    const user = await User.getUserById(req.user._id)
    const isPlaylist = req.query.isPlaylist
    const createQueue= await Player.createQueue(user,isPlaylist,sourceId,trackId);
    if( createQueue == 0) res.status(400).send("can not create queue");
    else res.send(" Queue is created successfully");
 
 }) 


module.exports = router; 


module.exports = router;