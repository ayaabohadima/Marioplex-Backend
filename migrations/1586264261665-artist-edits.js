const  {user:userDocument,artist:artistDocument,album:albumDocument,track:trackDocument,playlist:playlistDocument,category:categoryDocument} = require('../models/DB');
const mongoose=require('mongoose');
mongoose.Promise=global.Promise;
// connect to db
const atlas ='mongodb+srv://nada:nada@spotifycluster-i2m7n.mongodb.net/Spotify?retryWrites=true&w=majority';
const localhost = 'mongodb://localhost:27017/test' ;
const bahaa ="mongodb+srv://bahaaEldeen:123@spotifycluster-i2m7n.mongodb.net/test?retryWrites=true&w=majority"
const mlab = "mongodb://bahaa:123456b@ds157834.mlab.com:57834/spotify-demo"
mongoose.connect(mlab,{  useNewUrlParser: true, useCreateIndex: true ,useUnifiedTopology:true});
mongoose.connection.once('open',()=>{
console.log("connection is made");
}).on('error',function(error){
console.log("connection got error : ",error);
});
let defaultUser = mongoose.Types.ObjectId();
module.exports.up = async function (next) {
 await artistDocument.find({},async (err,files)=>{
    if(err) throw err;
    for(let file of files){
        file.Name = file.Name|| "anyName",

        file.userId = file.user? file.user.userId:defaultUser;
        file.user = undefined;

        await file.save();
    }
  })
  next()
}

module.exports.down = function (next) {
  next()
}
