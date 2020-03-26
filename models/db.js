const mongoose = require('mongoose');
const Schema= mongoose.Schema;
const Image=new Schema({ 
    height:Number ,
    wedth:Number ,
    URL:String
});


const Track=new Schema({ 
  artistId:mongoose.Schema.Types.ObjectId,
  albumId:mongoose.Schema.Types.ObjectId,
  availableMarkets:[String] ,
  discNumber:Number ,
  trackNumber:Number ,
  durationMs:Number ,
  explicit:Boolean ,
  previewURL:String ,
  popularity:Number ,
  name:String ,
  type:String ,
  isPlayable:Boolean ,
  acousticness:Number ,
  analysisURL:String ,
  danceability:Number ,
  energy:Number ,
  instrumentalness:Number ,
  key:Number ,
  liveness:Number ,
  loudness:Number ,
  mode:Number ,
  speechiness:Number ,
  tempo:Number ,
  timeSignature:Date ,
  valence:Number


});

const Playlist=new Schema({
  ownerId:mongoose.Schema.Types.ObjectId ,
  type:String ,
  collaborative:Boolean ,
  name:String ,
  isPublic:Boolean ,
  images:[Image] ,
  snapshot:[{
  hasTracks:[mongoose.Schema.Types.ObjectId],  //ref: 'Track',
  action:String
  }]
});

const Album=new Schema({
  images:[Image] ,
  artistId: mongoose.Schema.Types.ObjectId ,
  name:String ,
  type:String ,
  albumType:String ,
  popularity:Number ,
  genre:String ,
  releaseDate:Date ,
  availableMarkets: [String] ,
  releaseDatePercision: String ,
  label:String ,
  hasTracks:[{
    trackId: mongoose.Schema.Types.ObjectId,
    //ref: 'Track'
  }]
  
});

const Category=new Schema({
  name:String ,
  images:[Image] ,
  playlist:[mongoose.Schema.Types.ObjectId]
});


const User=new Schema({ 
  birthDate:Date ,
  email:String ,
  type:String ,
  password:String ,
  gender:String ,
  country:String ,
  isLogged:Boolean ,
  images:[Image] ,
  userType:String ,
  displayName:String ,
  product:String ,
  follow:[{
    id: mongoose.Schema.Types.ObjectId,
    //ref: 'User'
  }],
  followedBy:[{
    id: mongoose.Schema.Types.ObjectId,
    //ref: 'User'
  }],
  like:[{
    trackId: mongoose.Schema.Types.ObjectId
    //ref: 'Track'
  }],
  createPlaylist:[{
    playListId: mongoose.Schema.Types.ObjectId,
    //ref: 'Playlist',
    addedAt:Date ,
    isPrivate:Boolean ,
    collaboratorsId:[mongoose.Schema.Types.ObjectId ]
  }],
 
  saveAlbum:[{
    savedAt:Date,
    albumId: mongoose.Schema.Types.ObjectId,
    //ref: 'Album'
  }],

  playHistory:[{
    tracks: {trackId: mongoose.Schema.Types.ObjectId}	,
      //ref: 'Track'
    addedAt:Date ,
    type:String ,
  }],

  queue:{
    lastInPlaylistIndex:Number,
    queuIndex:Number,  
    tracksInQueue:[{
      trackId:   mongoose.Schema.Types.ObjectId,
        //ref: 'Track'
      isQueue:Boolean,
    }]
  },

  player:{
    last_playlist_track_index:Number,
    current_track: mongoose.Schema.Types.ObjectId,
    next_track: mongoose.Schema.Types.ObjectId,
    prev_track: mongoose.Schema.Types.ObjectId,
    is_playing:Boolean,
    is_shuffled:Boolean,
    current_source:mongoose.Schema.Types.ObjectId,
    isPlaylist:Boolean,
    is_repeat:Boolean,
    volume:Number
  }
});

const Artist=new Schema({ 
    name:String ,
    images:[Image] ,
    info:String ,
    popularity:Number,
    genre:[String] ,
    type:String ,
    Name:String ,
    images:[Image] ,
    userId: mongoose.Schema.Types.ObjectId ,
      //ref: 'User'
    addAlbums:[{
      albumId: mongoose.Schema.Types.ObjectId
      //ref: 'Album'
    }],
    addTracks:[{
      trackId: mongoose.Schema.Types.ObjectId
      //ref: 'Track'
    }]
});

const user=mongoose.model('User',User);
const artist=mongoose.model('Artist',Artist);
const album=mongoose.model('Album',Album);
const track=mongoose.model('Track',Track);
const playlist=mongoose.model('Playlist',Playlist);
const category=mongoose.model('Category',Category);


module.exports={user,artist,album,track,playlist,category}

