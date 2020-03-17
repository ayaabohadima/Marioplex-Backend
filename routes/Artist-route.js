const router = require('express').Router();

const Artist =require('../public-api/Artist-api');
const Album =require('../public-api/album-api');
const Track =require('../public-api/track-api');
const User = require('../public-api/user-api');
const {auth:checkAuth} = require('../middlewares/isMe');
const {content:checkContent} = require('../middlewares/content');
const {isArtist:checkType} = require('../middlewares/check-type');
const {upload:uploadTrack} = require('../middlewares/upload');

// get Artist
router.get('/Artists/:artist_id',checkAuth,async (req,res)=>{

    const artistID = req.params.artist_id;
    const artist = await Artist.getArtist(artistID);
    if(!artist) res.status(404); //not found
    else res.status(200).send(artist); 

});

// get Artists
router.get('/Artists/',[checkAuth,checkType],async (req,res)=>{
    const artistsIDs = req.query.artists_ids.split(',');
    const artists = await Artist.getArtists(artistsIDs);
    if(!artists) res.status(404).send({error:"artists with those id's are not found"});
    else res.status(200).json(artists);
});

// get Albums
router.get('/Artists/:artist_id/Albums',[checkAuth,checkType],async (req,res)=>{

    const albums = await Artist.getAlbums(req.params.artist_id,req.query.groups,req.query.country,req.query.limit,req.query.offset);
    if(albums.length==0) res.status(404).send({error:"albums with those specifications are not found"});
    else res.status(200).json(albums);
});

// get RelatedArtists
router.get('/Artists/:artist_id/related_artists',[checkAuth,checkType],async (req,res)=>{

    const artists = await Artist.getRelatedArtists(req.params.artist_id);
    if(artists.length==0) res.status(404).send({error:"no artists are found"});
    else res.status(200).json(artists);
});

// get Top Tracks
router.get('/Artists/:artist_id/toptracks',[checkAuth,checkType],async (req,res)=>{

    const tracks = await Artist.getTopTracks(req.params.artist_id,req.query.country);
    if(tracks.length==0) res.status(404).send({error:"no top tracks in this country are not found"});
    else res.status(200).json(tracks);
});

router.put('/Artists/:artist_id/Albums',[checkAuth,checkType,checkContent],async (req,res)=>{
    const Album = req.body.Album;
    const artistID=req.params.artist_id;
    const artistAlbum = await Artist.addAlbum(artistID,Album);
    if(!artistAlbum) res.status(404); //not found
    else res.status(200).send(artistAlbum); 

});

router.put('/Artists/:artist_id/Albums/:album_id/tracks',[checkAuth,checkType,uploadTrack.single('file')],async (req,res)=>{
// create track its external id=req.file.id
//add rest info to the track
let track=await Track.createTrack(req.file.id,req.body.name,req.body.TrackNum,req.body.availableMarkets);
await Album.addTrack(req.params.album_id,track);
await Artist.addTrack(req.params.artist_id,track._id);
res.status(200).send("Track saved");
});


module.exports = router;