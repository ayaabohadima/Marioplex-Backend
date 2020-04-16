const { user: userDocument, artist: artistDocument, album: albumDocument, track: trackDocument, playlist: playlistDocument, category: categoryDocument } = require('../models/db');


const mongoose = require('mongoose');
const Track = require('./track-api');
const Album = require('./album-api');
const Artist = require('./artist-api');
const checkMonooseObjectID = require('../validation/mongoose-objectid')

const Playlist = {


    /**
     * get a playlist by id
     * @param {string} playlistId - playlist id
     * @returns {Object|0} - playlist object
     */
    // get playlist by id
    // params : playlistId
    getPlaylist: async function(playlistId) {
        if (!checkMonooseObjectID([playlistId])) return 0;
        const playlist = await playlistDocument.findById(playlistId, (err, playlist) => {
            if (err) return 0;
            return playlist;
        }).catch((err) => 0);
        return playlist;

    },
    /**
     * get popular playlists
     * @returns {array<object>} - array of playlists' object
     */
    //get popular playlists based on popularity
    getPopularPlaylists: async function() {
        // with - is from big to small and without is from small to big
        var replaylists = []
        const playlists = await playlistDocument.find({}).sort('-popularity')
        if (playlists) {
            var limit; // to limit the num of playlists by frist 20 only but should check if num of albums less than 10  
            if (playlists.length < 20) limit = playlists.length;
            else limit = 20;
            for (let i = 0; i < limit; i++) {
                const user1 = await userDocument.findById(playlists[i].ownerId);
                replaylists.push({ owner: { id: playlists[i].ownerId, type: "user", name: user1.displayName }, collaborative: playlists[i].collaborative, type: 'playlist', name: playlists[i].name, images: playlists[i].images, id: playlists[i]._id, Description: playlists[i].Description, isPublic: playlists[i].isPublic });
            }
        }
        const replaylistsJson = { playlists: replaylists };
        return replaylistsJson;
    },
    /**
     * get playlist with tracks
     * @param {string} playlistId - playlist id
     * @param {string} snapshotID
     * @param {Object} user -user object
     * @returns {array<object>|0} - array of objects of a playlist and it's tracks
     */
    //for routes
    //get playlist with tracks
    //params: playlistId, snapshotID, user
    getPlaylistWithTracks: async function(playlistId, snapshotID, user) {
        if (!checkMonooseObjectID([playlistId, snapshotID])) return 0;
        const playlist = await this.getPlaylist(playlistId);
        let checkfollow = await this.checkFollowPlaylistByUser(user, playlistId);
        let checkcreate = await this.checkIfUserHasPlaylist(user, playlistId);
        if (!playlist) return 0;
        if (!playlist.snapshot) platlist.snapshot = [];
        if (playlist.isPublic || checkcreate || checkfollow) {
            var playlistJson = [];
            var tracks = [];
            let snapshot;
            let found = false;
            for (let i = 0; i < playlist.snapshot.length; i++) {
                if (playlist.snapshot[i]._id == snapshotID) {
                    snapshot = i;
                    found = true;
                }
            }
            if (!found) { snapshot = playlist.snapshot.length - 1; }
            if (playlist.snapshot[snapshot] != undefined) {
                if (!playlist.snapshot[snapshot].hasTracks) playlist.snapshot[snapshot].hasTracks = [];
                for (let i = 0; i < playlist.snapshot[snapshot].hasTracks.length; i++) {

                    const track1 = await Track.getTrack(playlist.snapshot[snapshot].hasTracks[i]);
                    const artistId = track1.artistId;
                    const albumId = track1.albumId;
                    const album = await Album.getAlbumById(albumId);
                    const artist = await Artist.getArtist(artistId);
                    if (!album || !artist) { return 0; }
                    const isLiked = await Track.checkIfUserLikeTrack(user, track1._id) ? true : false;
                    tracks.push({ trackid: track1.id, name: track1.name, artistId: artistId, artistName: artist.Name, albumId: albumId, albumName: album.name, isLiked: isLiked });
                }
            }
            const followPlaylist = await this.checkFollowPlaylistByUser(user, playlistId) ? true : false;
            playlistJson.push({ id: playlist._id, type: playlist.type, name: playlist.name, ownerId: playlist.ownerId, collaborative: playlist.collaborative, isPublic: playlist.isPublic, images: playlist.images, tracks: tracks, isfollowed: followPlaylist });
            return playlistJson;
        }
        return 0;
    },
    /**
     * check if user has a specific playlist
     * @param {string} playlistId - playlist id
     * @param {Object} user - user object
     * @returns {number|undefined} - the index of playlist id in user's playlists
     */

    //check if user has a specific playlist
    //params:user, playlistID
    checkIfUserHasPlaylist: async function(user, playlistID) {
        if (!checkMonooseObjectID([playlistID])) return 0;
        const userPlaylists = user.createPlaylist;

        if (userPlaylists) {
            return await userPlaylists.find(playlist => playlist.playListId + 1 == playlistID + 1);
        }
        return 0;
    },
    /**
     * create playlist
     * @param {string} [description] - playlist discription
     * @param {string} Name - playlist name
     * @param {string} userid - user id
     * @returns {Object} - playlist object
     */
    // create playlist
    // params : userid, Name, description
    createPlaylist: async function(userid, Name, description) {
        if (!checkMonooseObjectID([userid])) return 0;
        let desc = (description == undefined) ? "" : description;
        const Playlist = new playlistDocument({
            _id: mongoose.Types.ObjectId(),
            type: "playlist",
            Description: desc,
            collaborative: false,
            name: Name,
            isPublic: true,
            ownerId: userid,
            images: [],
            snapshot: []
        })

        await Playlist.save();
        return Playlist;
    },
    /**
     * find index of track in playlist
     * @param {string} trackId - track id 
     * @param {Object} tplaylist - playlist object
     * @returns {number} 
     */
    findIndexOfTrackInPlaylist: async function(trackId, tplaylist) {
        if (!checkMonooseObjectID([trackId])) return 0;
        if (!tplaylist.hasTracks) tplaylist.hasTracks = [];
        for (let i = 0; i < tplaylist.hasTracks.length; i++) {
            if (tplaylist.hasTracks[i].trackId == trackId)
                return i;
        }
        return -1
    },
    /**
     * delete user's created playlist
     * @param {string} playlistId - playlist id 
     * @param {Object} user - user object
     * @returns {boolean} 
     */
    //delete playlist
    //params :user, playlistId
    deletePlaylist: async function(user, playlistId) {
        if (!checkMonooseObjectID([playlistId])) return 0;
        const playlist = await Playlist.getPlaylist(playlistId);
        if (playlist) {
            const userHasPlaylist = await Playlist.checkIfUserHasPlaylist(user, playlistId);
            if (userHasPlaylist) {
                if (!user.createPlaylist) user.createPlaylist = [];
                for (let i = 0; i < user.createPlaylist.length; i++) {

                    if (user.createPlaylist[i].playListId == playlistId) {

                        user.createPlaylist.splice(i, 1);
                        await user.save();
                    }
                }
                return await this.unfollowPlaylist(user, playlistId);

            }
        } else return 0;
    },
    /**
     * check if user followz playlist
     * @param {string} playlistID - playlist id 
     * @param {Object} user - user object
     * @returns {boolean} 
     */
    //check if user followz playlist
    //params:user, playlistID
    checkFollowPlaylistByUser: async function(user, playlistID) {
        if (!checkMonooseObjectID([playlistID])) return 0;
        const followedplaylists = user.followPlaylist;

        if (followedplaylists) {
            const followed = await followedplaylists.find(playlist => playlist.playListId + 1 == playlistID + 1);

            return followed
        }
        return 0;
    },
    /**
     * user follow playlist
     * @param {string} playlistID - playlist id 
     * @param {Object} user - user object
     * @param {boolean} [isPrivate] - If true the playlist will be included in user’s public playlists, if false it will remain private. 
     * @returns {boolean} 
     */
    //user follow playlist
    //params : user , playlist-id ,isPrivate
    followPlaylits: async function(user, playlistID, isPrivate) {
        if (!checkMonooseObjectID([playlistID])) return 0;
        let check = await this.getPlaylist(playlistID);
        if (!check) { return 0; }
        const followedBefore = await this.checkFollowPlaylistByUser(user, playlistID)
        if (followedBefore) {
            return 0;
        }

        if (!isPrivate || isPrivate == 'false') {
            isPrivate = false;
        } else
            isPrivate = true;
        if (user.followPlaylist) {
            user.followPlaylist.push({
                playListId: playlistID,
                isPrivate: isPrivate

            });
            await user.save();
            return 1;
        }
        user.followPlaylist = [];
        user.followPlaylist.push({

            playListId: playlistID,
            isPrivate: isPrivate
        });
        await user.save().catch();
        return 1;
    },
    //user unfollows a playlist
    //params:user, playlistID
    unfollowPlaylist: async function(user, playlistID) {
        if (!checkMonooseObjectID([playlistID])) return 0;
        let check = await this.getPlaylist(playlistID);
        if (!check) { return 0; }
        const followedBefore = await this.checkFollowPlaylistByUser(user, playlistID)

        if (!followedBefore) {

            return 0;
        }
        if (user.followPlaylist) {

            for (let i = 0; i < user.followPlaylist.length; i++) {

                if (user.followPlaylist[i].playListId == playlistID) {

                    user.followPlaylist.splice(i, 1);
                    await user.save();
                    return 1;
                }
            }
        }
        return 0;
    },
    /**
     * user unfollows a playlist
     * @param {string} playlistID - playlist id 
     * @param {Object} user - user object
     * @returns {boolean} 
     */

    //user adds track(s) to a specific playlist
    //params: playlistID, tracksIds
    addTrackToPlaylist: async function(playlistID, tracksIds) {
        if (!checkMonooseObjectID([playlistID])) return 0;
        if (!checkMonooseObjectID(trackIds)) return 0;
        if (!trackIds) trackIds = [];
        if (!tracksIds || tracksIds.length == 0) return 0;
        let playlist = await this.getPlaylist(playlistID);
        if (!playlist) return 0;
        if (!playlist.snapshot) playlist.snapshot = [];
        let len = playlist.snapshot.length;
        let tracks = [];
        if (len) {
            if (!playlist.snapshot[len - 1].hasTracks) playlist.snapshot[len - 1].hasTracks = [];
            for (let i = 0; i < playlist.snapshot[len - 1].hasTracks.length; i++) {
                tracks.push(playlist.snapshot[len - 1].hasTracks[i]);
            }
        }
        for (let i = 0; i < tracksIds.length; i++) {
            // check if trackid is valid mongoose object id
            if (!mongoose.Types.ObjectId.isValid(tracksIds[i])) return 0;
            tracks.push(tracksIds[i]);
        }
        let uniquetracks = await this.removeDups(tracks);
        playlist.snapshot.push({
            hasTracks: uniquetracks,
            action: 'Add Tracks'
        });
        await playlist.save();
        return playlist;
    },
    /**
     * user adds track(s) to a specific playlist
     * @param {string} playlistID - playlist id 
     * @param {array<string>} tracksIds - array of tracks' id
     * @returns {Object|0} - playlist object
     */
    removeDups: async function(tracks) {
        if (!tracks) tracks = [];
        let unique = {};
        tracks.forEach(function(i) {
            if (!unique[i]) {
                unique[i] = true;
            }
        });
        return Object.keys(unique);
    },
    /**
     * user updates playlist details
     * @param {string} playlistId - playlist id 
     * @param {Object} details - object of the data to be updated
     * @returns {Object|0} - playlist object
     */
    //user updates playlist details
    //params :playlistId, details
    updatePlaylistDetails: async function(playlistId, details) {
        if (!checkMonooseObjectID([playlistId])) return 0;
        let playlist = await this.getPlaylist(playlistId);
        if (!playlist) return 0;
        await playlistDocument.updateOne({ _id: playlistId }, details);
        playlist = await this.getPlaylist(playlistId);
        return playlist;
    },
    /**
     * get playlists of a user
     * @param {string} userId - user id 
     * @param {number} [limit] - the maximum number of objects to return
     * @param {number} [offset] - the index of the first object to return
     * @param {boolean} isuser - if the user is the owner of the playlist
     * @returns {array<object>|0} - array of playlists' object
     */
    //get playlists of a user
    //params:userId, limit, offset, isuser
    getUserPlaylists: async function(userId, limit, offset, isuser) {
        if (!checkMonooseObjectID([userId])) return 0;
        let user = await userDocument.findById(userId);
        if (!user) return 0;
        let playlistsIds = [];
        let playlists = [];
        if (!user.followPlaylist) user.followPlaylist = [];
        for (var i = 0; i < user.followPlaylist.length; i++) {
            if (isuser) {
                playlistsIds.push(user.followPlaylist[i].playListId);
            } else {
                if (!user.followPlaylist[i].isPrivate) {
                    playlistsIds.push(user.followPlaylist[i].playListId);
                }
            }
        }
        for (var i = 0; i < playlistsIds.length; i++) {
            let playlist = await this.getPlaylist(playlistsIds[i]);
            let owner = await userDocument.findById(playlist.ownerId);
            playlists.push({ id: playlist._id, name: playlist.name, ownerId: playlist.ownerId, owner: owner.displayName, collaborative: playlist.collaborative, isPublic: playlist.isPublic, images: playlist.images });
        }
        let start = 0;
        let end = playlists.length;
        if (offset != undefined) {
            if (offset >= 0 && offset <= playlists.length) {
                start = offset;
            }
        }
        if (limit != undefined) {
            if ((start + limit) > 0 && (start + limit) <= playlists.length) {
                end = start + limit;
            }
        }
        playlists.slice(start, end);
        return playlists;
    },
    /**
     * user toggles collaboration
     * @param {Object} user - user object
     * @param {string} playlistID - playlist id
     * @returns {boolean} 
     */
    //user toggles collaboration
    //params:user, playlistID
    changeCollaboration: async function(user, playlistID) {
        if (!checkMonooseObjectID([playlistID])) return 0;
        let playlist = await playlistDocument.findById(playlistID);
        if (!playlist) return false;
        if (!user.createPlaylist) user.createPlaylist = [];
        playlist.collaborative = !playlist.collaborative;
        if (playlist.collaborative) {
            playlist.isPublic = false;
            for (var i = 0; i < user.createPlaylist.length; i++) {
                if (user.createPlaylist[i].playListId == playlistID) {
                    user.createPlaylist[i].isPrivate = true;
                    await user.save();
                    await playlist.save();
                    return true;
                }
            }
        }
        await playlist.save();
        return true;

    },
    /**
     * user toggles public status
     * @param {Object} user - user object
     * @param {string} playlistID - playlist id
     * @returns {boolean} 
     */
    //user toggles public status
    //params:user, playlistID
    changePublic: async function(user, playlistID) {
        if (!checkMonooseObjectID([playlistID])) return 0;
        let playlist = await playlistDocument.findById(playlistID);
        if (!playlist) return false;
        if (playlist.collaborative) { return false; }
        playlist.isPublic = !playlist.isPublic;
        if (!user.createPlaylist) user.createPlaylist = [];
        for (var i = 0; i < user.createPlaylist.length; i++) {
            if (user.createPlaylist[i].playListId == playlistID) {
                user.createPlaylist[i].isPrivate = !user.createPlaylist[i].isPrivate;
                await user.save();
                await playlist.save();
                return true;
            }
        }
        if (!user.followPlaylist) user.followPlaylist = [];
        for (var i = 0; i < user.followPlaylist.length; i++) {
            if (user.followPlaylist[i].playListId == playlistID) {
                user.followPlaylist[i].isPrivate = !user.followPlaylist[i].isPrivate;
                await user.save();
                await playlist.save();
                return true;
            }
        }
        return false;

    },
    /**
     * get playlist tracks (WITHOUT DETAILS OF THESE TRACKS)
     * @param {string} playlistID - playlist id
     * @returns {array<object>|0} -array of tracks' object 
     */
    //get playlist tracks (WITHOUT DETAILS OF THESE TRACKS)
    //params:playlistID
    getPlaylistTracks: async function(playlistID) {
        if (!checkMonooseObjectID([playlistID])) return 0;
        let playlist = await playlistDocument.findById(playlistID);
        if (!playlist) return 0;
        let tracks = [];
        if (!playlist.snapshot) playlist.snapshot = [];

        let len = playlist.snapshot.length;
        if (len == 0) { return 0; }
        if (!playlist.snapshot[len - 1].hasTracks) playlist.snapshot[len - 1].hasTracks = [];
        for (var i = 0; i < playlist.snapshot[len - 1].hasTracks.length; i++) {
            let track = await Track.getTrack(playlist.snapshot[len - 1].hasTracks[i]);
            if (track) {
                tracks.push(track);
            }
        }
        return tracks;

    },
    /**
     * remove tracks from a given playlist
     * @param {string} playlistID - playlist id
     * @param {string} snapshotID - snapshot id
     * @param {array<string>} tracksids -array of tracks' id
     * @returns {array<object>|0} -array of tracks' object 
     */
    //remove tracks from a given playlist
    //params:playlistID, tracksids, snapshotid
    removePlaylistTracks: async function(playlistID, tracksids, snapshotid) {
        if (!checkMonooseObjectID([playlistID])) return 0;
        if (!checkMonooseObjectID(trackids)) return 0;
        let playlist = await playlistDocument.findById(playlistID);
        if (!playlist) return 0;
        let tracks = [];
        if (!playlist.snapshot) playlist.snapshot = [];
        let len = playlist.snapshot.length;
        if (len == 0) { return 0; }
        let found = false;
        if (snapshotid != undefined) {
            for (var i = 0; i < playlist.snapshot.length; i++) {
                if (playlist.snapshot[i]._id == snapshotid) {
                    len = i + 1;
                    found = true;
                    break;
                }
            }
            if (!found) { return 0; }
        }
        if (!playlist.snapshot[len - 1].hasTracks) playlist.snapshot[len - 1].hasTracks = [];
        for (var i = 0; i < playlist.snapshot[len - 1].hasTracks.length; i++) {
            let track = await Track.getTrack(playlist.snapshot[len - 1].hasTracks[i]);
            if (track) {
                tracks.push(track);
            }
        }
        for (var i = 0; i < tracksids.length; i++) {
            for (var j = 0; j < tracks.length; j++) {
                if (tracksids[i] == tracks[j]._id) {
                    tracks.splice(j, 1);
                }
            }
        }
        playlist.snapshot.push({
            hasTracks: tracks,
            action: 'remove Tracks'
        });
        await playlist.save();
        return playlist;

    },
    /**
     * reorder tracks in a playlist
     * @param {string} playlistID - playlist id
     * @param {string} snapshotid - snapshot id
     * @param {number} start 
     * @param {number} before 
     * @param {number} length
     * @returns {Object|0} -playlist object
     */
    //reorder tracks in a playlist
    //params:playlistID, snapshotid, start, length, before
    reorderPlaylistTracks: async function(playlistID, snapshotid, start, length, before) {
        if (!checkMonooseObjectID([playlistID, snapshotid])) return 0;
        let playlist = await playlistDocument.findById(playlistID);
        if (!playlist) return 0;
        let tracks = [];
        if (!playlist.snapshot) playlist.snapshot = [];
        let len = playlist.snapshot.length;
        if (len == 0) { return 0; }
        let found = false;
        if (snapshotid != undefined) {
            for (var i = 0; i < playlist.snapshot.length; i++) {
                if (playlist.snapshot[i]._id == snapshotid) {
                    len = i + 1;
                    found = true;
                    break;
                }
            }
            if (!found) { return 0; }
        }
        if (!playlist.snapshot[len - 1].hasTracks) playlist.snapshot[len - 1].hasTracks = [];
        for (var i = 0; i < playlist.snapshot[len - 1].hasTracks.length; i++) {
            // to check track still exist in DB
            let track = await Track.getTrack(playlist.snapshot[len - 1].hasTracks[i]);
            if (track) {
                tracks.push(track._id);
            }
        }
        let orderedtracks = [];
        // check start is in range
        start--;
        let stindex = Number(start) < 1 ? 0 : Number(start) > tracks.length ? tracks.length - 1 : Number(start);
        // check that lenght in range
        let endindex = (!length) ? Number(stindex + 1) : (stindex + length - 1);
        endindex = endindex > tracks.length - 1 ? tracks.length - 1 : endindex;
        before--;
        before = before < 0 ? 0 : before > tracks.length - 1 ? tracks.length - 1 : before;
        // add tracks in range to order tracks
        for (let i = stindex; i <= endindex; i++) {
            orderedtracks.push(tracks[i]);
        }
        // remove tracks in this range from tracks in snashot
        tracks.splice(stindex, endindex - stindex + 1);
        // add those tracks before the inserted before index
        if (before != 0) tracks.splice(before, 0, ...orderedtracks);
        else tracks.unshift(...orderedtracks);
        playlist.snapshot.push({
            hasTracks: tracks,
            action: 'reorder Tracks'
        });
        await playlist.save();
        return playlist;

    },
}



module.exports = Playlist;