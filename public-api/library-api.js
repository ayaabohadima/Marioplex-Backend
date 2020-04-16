const { user: userDocument, artist: artistDocument, album: albumDocument, track: trackDocument, playlist: playlistDocument, category: categoryDocument } = require('../models/db');
const spotify = require('../models/db');
const Album = require('./album-api');
const Track = require('./track-api');
const artist_api = require('./artist-api');
const checkMonooseObjectID = require('../validation/mongoose-objectid')
const Library = {

    //check if user saves albums
    //params: array of AlbumsIDs, UserID
    checkSavedAlbums: async function(AlbumsIDs, UserID) {
        if (!checkMonooseObjectID(AlbumsIDs)) return 0;
        if (!checkMonooseObjectID([UserID])) return 0;
        let Checks = [];
        let found = false;
        const user = await userDocument.findById(UserID, (err, user) => {
            if (err) return 0;
            return user;
        }).catch((err) => 0);
        if (!user.saveAlbum) user.saveAlbum = [];
        for (var i = 0; i < AlbumsIDs.length; i++) {
            found = false;

            for (let Album in user.saveAlbum) {
                if (user.saveAlbum[Album].albumId == AlbumsIDs[i]) {
                    Checks.push(true);
                    found = true;
                }
            }
            if (!found) {
                Checks.push(false);
            }
        }
        return Checks;

    },
    //check if user saves tracks
    //params: array of TracksIDs, UserID
    checkSavedTracks: async function(TracksIDs, UserID) {
        if (!checkMonooseObjectID([UserID])) return 0;
        if (!checkMonooseObjectID(TracksIDs)) return 0;
        let Checks = [];
        let found = false;
        const user = await userDocument.findById(UserID, (err, user) => {
            if (err) return 0;
            return user;
        }).catch((err) => 0);
        if (!user.like) user.like = [];
        for (var i = 0; i < TracksIDs.length; i++) {
            found = false;
            for (let Track in user.like) {
                if (user.like[Track].trackId == TracksIDs[i]) {
                    Checks.push(true);
                    found = true;
                }
            }
            if (!found) {
                Checks.push(false);
            }
        }
        return Checks;

    },

    //get  saved albums for a user
    //params: UserID, limit, offset
    getSavedAlbums: async function(UserID, limit, offset) {
        if (!checkMonooseObjectID([UserID])) return 0;
        let Albums = [];
        let user = await userDocument.findById(UserID);
        if (!user) return 0;
        if (!user.saveAlbum) user.saveAlbum = [];
        if (!user.saveAlbum.length) return 0;
        for (let i = 0; i < user.saveAlbum.length; i++) {
            let album = await Album.getAlbumById(user.saveAlbum[i].albumId);
            if (album) Albums.push(album);
        }

        let start = 0;
        let end = (Albums.length > 20) ? 20 : Albums.length;
        if (offset != undefined) {
            if (offset >= 0 && offset <= Albums.length) {
                start = offset;
            }
        }
        if (limit != undefined) {
            if ((start + limit) > 0 && (start + limit) <= Albums.length) {
                end = start + limit;
            }
        }
        albumsSlice = Albums.slice(start, end);
        albumInfo = []
        for (let i = 0; i < albumsSlice.length; i++) {
            let albums = await Album.getAlbumArtist(albumsSlice[i]._id, UserID);
            if (albums) {
                albumInfo.push(albums);
            }

        }
        return albumInfo;

    },


    //get  saved traks for a user
    //params: UserID, limit, offset
    getSavedTracks: async function(UserID, limit, offset) {
        if (!checkMonooseObjectID([UserID])) return 0;
        let Tracks = [];
        let user = await userDocument.findById(UserID);
        if (!user) return 0;
        if (!user.like) user.like = [];
        if (!user.like.length) { return 0; }
        for (let i = 0; i < user.like.length; i++) {
            let track = await Track.getTrack(user.like[i].trackId);
            if (track) Tracks.push(track);
        }
        let start = 0;
        let end = (Tracks.length > 20) ? 20 : Tracks.length;
        if (offset != undefined) {
            if (offset >= 0 && offset <= Tracks.length) {
                start = offset;
            }
        }
        if (limit != undefined) {
            if ((start + limit) > 0 && (start + limit) <= Tracks.length) {
                end = start + limit;
            }

        }
        trackSlice = Tracks.slice(start, end);
        trackInfo = []
        for (let i = 0; i < trackSlice.length; i++) {
            let artist = await artist_api.getArtist(trackSlice[i].artistId)
            tracks = {}
            if (artist) {
                tracks["artistId"] = artist._id
                tracks["artistName"] = artist.Name
                tracks["artistimages"] = artist.images
                tracks["artistType"] = artist.type
            }
            let album = await Album.getAlbumById(trackSlice[i].albumId)
            if (album) {
                tracks["albumId"] = album._id
                tracks["albumName"] = album.name
                tracks["albumImages"] = album.images
                tracks["albumType"] = album.type
            }
            tracks["_id"] = trackSlice[i]._id
            tracks["name"] = trackSlice[i].name
            tracks["type"] = trackSlice[i].type
            tracks["images"] = trackSlice[i].images
            trackInfo.push(tracks);
        }
        return { "tracks": trackInfo, "ownerName": user.displayName };

    }


}

module.exports = Library;