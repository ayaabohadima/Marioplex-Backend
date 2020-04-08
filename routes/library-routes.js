const router = require('express').Router();

const Library = require('../public-api/library-api');
const User = require('../public-api/user-api')
const { auth: checkAuth } = require('../middlewares/is-me');

 //GET USER'S FOLLOWING ARTISTS
 router.get('/me/followingArtist', checkAuth, async(req, res) => {

    const userID = req.user._id;
    const checks = await User.getUserFollowingArtist(userID);
    if (!checks) res.sendStatus(404); //not found
    else res.status(200).json(checks);

});

//CHECK IF USER SAVES ALBUMS - QUERY PARAMS: albums_ids
router.get('/me/albums/contains', checkAuth, async(req, res) => {

    const userID = req.user._id;
    const albumsIDs = req.query.albums_ids.split(',');
    const checks = await Library.checkSavedAlbums(albumsIDs, userID);
    if (!checks) res.sendStatus(404); //not found
    else res.status(200).json(checks);

});

//CHECK IF USER SAVES TRACKS - QUERY PARAMS: tracks_ids
router.get('/me/tracks/contains', checkAuth, async(req, res) => {

    const userID = req.user._id;
    const tracksIDs = req.query.tracks_ids.split(',');
    const checks = await Library.checkSavedTracks(tracksIDs, userID);
    if (!checks) res.sendStatus(404); //not found
    else res.status(200).json(checks);

});

//GET USER'S SAVED ALBUMS - QUERY PARAMS: limit, offset
router.get('/me/albums', checkAuth, async(req, res) => {

    const userID = req.user._id;
    const albums = await Library.getSavedAlbums(userID, req.query.limit, req.query.offset);
    if (!albums) res.sendStatus(404); //not found
    else res.status(200).json(albums);

});

//GET USER'S SAVED TRACKS - QUERY PARAMS: limit, offset
router.get('/me/tracks', checkAuth, async(req, res) => {

    const userID = req.user._id;
    const tracks = await Library.getSavedTracks(userID, req.query.limit, req.query.offset);
    if (!tracks) res.sendStatus(404); //not found
    else res.status(200).json(tracks);

});



module.exports = router;