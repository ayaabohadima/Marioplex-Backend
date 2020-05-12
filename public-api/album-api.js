const { user: userDocument, artist: artistDocument, album: albumDocument, track: trackDocument, playlist: playlistDocument, category: categoryDocument } = require('../models/db');


// initialize db 
const connection = require('../db-connection/connection');
const User = require('./user-api');
const track = require('./track-api');
const artist = require('./artist-api');
const checkMonooseObjectID = require('../validation/mongoose-objectid')
const Album = {
    // add tack to album 
    addTrack: async function(AlbumId, Track) {
        if (!checkMonooseObjectID([AlbumId])) return 0;
        const album = await albumDocument.findById(AlbumId);
        if (album) {
            if (!album.hasTracks) album.hasTracks = [];
            album.hasTracks.push({
                trackId: Track._id
            });
            await album.save();
            return 1;
        }
    },
    // get album by id
    getAlbumById: async function(albumID) {

        // connect to db and find album with the same id then return it as json file
        // if found return album else return 0
        if (!checkMonooseObjectID([albumID])) return 0;
        let album = await albumDocument.findById(albumID, (err, album) => {
            if (err) return 0;
            return album;
        }).catch((err) => 0);
        return album;


    },
    deleteAlbum: async function(userId, albumId) {
        if (!checkMonooseObjectID([albumId])) return 0;
        const artistD = await artist.findMeAsArtist(userId);
        if (!artist) return 0;
        if (!artist.checkArtisthasAlbum(artistD._id, albumId)) return 0;
        const album = await this.getAlbumById(albumId);
        if (!album) return 0;
        if (album.hasTracks) {
            for (let i = 0; i < album.hasTracks.length; i++) {
                await track.deleteTrack(userId, album.hasTracks[i].trackId);
            }
        }
        for (let i = 0; i < artistD.addAlbums.length; i++) {
            //console.log(artistD.addAlbums[i].albumId);
            //console.log(albumId);
            if (artistD.addAlbums[i].albumId + 1 == albumId + 1) { artistD.addAlbums.splice(i, 1); break; }
        }
        await artistD.save();
        if (!await albumDocument.findByIdAndDelete(albumId)) return 0;

        await userDocument.find({}, async(err, files) => {
            if (err) return 0;
            for (let user of files) {
                if (!user.saveAlbum) continue;
                for (let i = 0; i < user.saveAlbum; i++) {
                    if (String(user.saveAlbum[i].albumId) == albumId) {
                        user.saveAlbum.splice(i, 1);
                        break;
                    }
                }
                await user.save();
            }
        });
        return 1;
    },

    // new releases for home page 
    getNewReleases: async function() {
        // with - is from big to small and without is from small to big
        var reAlbums = []
        const albums = await albumDocument.find({}).sort('-releaseDate')
        if (albums) {
            var limit; // to limit the num of albums by frist 10 only but should check if num of albums less than 10  
            if (albums.length < Number(process.env.LIMIT) ? Number(process.env.LIMIT) : 20) limit = albums.length;
            else limit = Number(process.env.LIMIT) ? Number(process.env.LIMIT) : 20;

            for (let i = 0; i < limit; i++) {
                const artist1 = await artist.getArtist(albums[i].artistId);
                reAlbums.push({ album_type: albums[i].albumType, artist: { type: 'artist', id: albums[i].artistId, name: artist1.Name }, available_markets: albums[i].availableMarkets, images: albums[i].images, id: albums[i]._id, name: albums[i].name, type: 'album' });
            }
        }
        const reAlbumsJson = { albums: reAlbums };
        return reAlbumsJson;
    },

    getPopularAlbums: async function() {
        // with - is from big to small and without is from small to big
        var reAlbums = []
        const albums = await albumDocument.find({}).sort('-popularity')
        if (albums) {
            var limit; // to limit the num of albums by frist 20 only but should check if num of albums less than 10  
            if (albums.length < Number(process.env.LIMIT) ? Number(process.env.LIMIT) : 20) limit = albums.length;
            else limit = Number(process.env.LIMIT) ? Number(process.env.LIMIT) : 20;
            for (let i = 0; i < limit; i++) {
                if (albums[i].artistId) {
                    const artist1 = await artist.getArtist(albums[i].artistId);
                    reAlbums.push({ album_type: albums[i].albumType, artist: { type: 'artist', id: albums[i].artistId, name: artist1.Name }, available_markets: albums[i].availableMarkets, images: albums[i].images, id: albums[i]._id, name: albums[i].name, type: 'album' });
                }
            }
        }
        const reAlbumsJson = { albums: reAlbums };
        return reAlbumsJson;
    },
    // get album artist
    getAlbumArtist: async function(albumID, userID) {

        // connect to db and find album with the same id then return it as json file
        // if found return album else return 0
        if (!checkMonooseObjectID([albumID, userID])) return 0;
        let album = await this.getAlbumById(albumID);
        let albumInfo = {}
        let user = await userDocument.findById(userID);
        if (user) {
            let isSaved = await this.checkIfUserSaveAlbum(user, albumID);
            if (isSaved) {
                albumInfo['isSaved'] = true;
            } else {
                albumInfo['isSaved'] = false;
            }

        }
        if (album) {
            let Artist = await artist.getArtist(album.artistId);
            let track1 = await this.getTracksAlbum(albumID, user);
            albumInfo['_id'] = album._id;
            albumInfo['name'] = album.name;
            albumInfo['images'] = album.images;
            if (Artist) {
                albumInfo['artistId'] = Artist._id;
                albumInfo['artistName'] = Artist.Name;
            }
            if (track1) {
                albumInfo['track'] = track1;
            } else {
                albumInfo['track'] = []
            }
            return albumInfo;
        } else {
            return 0;
        }



    },
    // the order of track in album 's tracks
    findIndexOfTrackInAlbum: async function(trackId, album) {
        if (!checkMonooseObjectID([trackId])) return -1;
        if (!album.hasTracks) album.hasTracks = [];
        for (let i = 0; i < album.hasTracks.length; i++) {
            if (album.hasTracks[i].trackId == trackId) return i;
        }
        return -1
    },
    // get several albums by ids
    getAlbums: async function(albumIds, limit, offset) {

        // connect to db and find album with the same id then return it as json file
        // if found return album else return 0

        var Album = []
        if (albumIds == undefined) return 0;
        if (!checkMonooseObjectID(albumIds)) return 0;
        for (var i = 0; i < albumIds.length; i++) {
            var album = await this.getAlbumById(albumIds[i]);
            if (album) {
                Album.push(album)
            }
        }
        if (Album.length > 0) {
            AlbumWithArtist = []
            for (let i = 0; i < Album.length; i++) {
                let Artist = await artist.getArtist(Album[i].artistId);
                if (Artist) {
                    AlbumWithArtist.push({ Album: Album[i], Artist: Artist });
                }
            }
            return limitOffset(limit, offset, AlbumWithArtist)

        } else return 0;
    },
    //  get tracks of an album
    getTracksAlbum: async function(albumID, user) {

        // connect to db and find album with the same id then return it as json file
        // if found return album else return 0
        if (!checkMonooseObjectID([albumID])) return 0;
        const Tracks = [];
        const album = await this.getAlbumById(albumID);
        if (!album) {
            return 0;
        } else {
            if (!album.hasTracks) album.hasTracks = [];
            for (i = 0; i < album.hasTracks.length; i++) {
               
                if (!album.hasTracks[i].trackId) continue;
                var Track = await track.getTrack(album.hasTracks[i].trackId, user);
               
                if (Track) {
                    let tracks = {}
                    tracks['_id'] = Track._id;
                    tracks['name'] = Track.name;
                    tracks['images'] = Track.images;
                    tracks['isLiked'] = await track.checkIfUserLikeTrack(user, Track._id);
                    tracks['playable'] = Track.playable;
                    Tracks.push(tracks);
                    
                }
               
                
            }
            
        }
        
        if (Tracks.length == 0) {
            return 0;
        }
        return Tracks;
    },
    //user like album by track-id
    //params : user , track-id
    checkIfUserSaveAlbum: function(user, albumID) {
        if (!checkMonooseObjectID([albumID])) return 0;
        const albumsUserSaved = user.saveAlbum;
        // if user.like.contains({track_id:track.track_id})
        if (albumsUserSaved) {
            return albumsUserSaved.find(album => String(album.albumId) == String(albumID));
        }
        return 0;
    },
    //user save track by album-id
    //params : user , album-id
    saveAlbum: async function(user, albumID) {
        // check if user already saved the album
        // if not found then add album.album_id to user likes and return the updated user
        // else return 0 as he already saved the album
        if (albumID == undefined) return 2;
        if (!checkMonooseObjectID(albumID)) return 0;
        let albums = [];
        for (let j = 0; j < albumID.length; j++) {
            let album = await this.getAlbumById(albumID[j]);
            if (album) {
                albums.push(albumID[j]);
            }
        }
        if (albums.length == 0) { return 2; }
        let count = 0;
        for (let i = 0; i < albums.length; i++) {
            if (this.checkIfUserSaveAlbum(user, albums[i]) == undefined) {
                if (user.saveAlbum) {
                    user.saveAlbum.push({
                        albumId: albums[i],
                        savedAt: Date.now()
                    });
                    await user.save();
                } else {
                    user.saveAlbum = [];
                    user.saveAlbum.push({
                        albumId: albums[i],
                        savedAt: Date.now()
                    });
                    await user.save();
                }
            } else { count++; }
        }
        if (count == albums.length) {
            return 0;
        }
        return 1;
    },
    unsaveAlbum: async function(user, albumID) {
        // check if user already saved the album
        // if not found then add album.album_id to user likes and return the updated user
        // else return 0 as he already saved the album
        let found = false;
        if (albumID == undefined) return 0;
        if (!checkMonooseObjectID(albumID)) return 0;
        for (let j = 0; j < albumID.length; j++) {
            if (this.checkIfUserSaveAlbum(user, albumID[j])) {
                found = true;
                for (let i = 0; i < user.saveAlbum.length; i++) {
                    if (String(user.saveAlbum[i].albumId) == String(albumID[j])) {
                        user.saveAlbum.splice(i, 1);
                    }
                }
                await user.save().catch();
            } else {
                if ((!found && (j == (albumID.length - 1))) || (albumID.length == 1)) {
                    return 0;
                }
            }
        }
        return 1;
    }
}
module.exports = Album;

function limitOffset(limit, offset, specificAlbums) {

    let start = 0;
    let end = specificAlbums.length;
    if (offset != undefined) {
        if (offset >= 0 && offset <= specificAlbums.length) {
            start = offset;
        }
    }
    if (limit != undefined) {
        if ((start + limit) > 0 && (start + limit) <= specificAlbums.length) {
            end = start + limit;
        }
    } else {
        limit = Number(process.env.LIMIT) ? Number(process.env.LIMIT) : 20;
        if ((start + limit) > 0 && (start + limit) <= specificAlbums.length) {
            end = start + limit;
        }
    }
    specificAlbums.slice(start, end);
    return specificAlbums;
}