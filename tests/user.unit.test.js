const MockUser =  {
    user:[],
getUserById:  function(userId) {
    return this.user.find(User => User._id==userId);
},

//update user profile information
//params: userID, Display_Name(optional), Password(optional),
//        Email(optional), Country(optional) 
update:  function(userID, Display_Name, Password, Email, Country) {

    const user = this.getUserById(userID);
    if (user) {
        if (user.isFacebook) {
            //if from facebok change country only
            if (Country) 
            user.country = Country;

        } 
        else {
            // else update the
            if (Display_Name != undefined) {
                user.displayName = Display_Name;
            }
            if (Password != undefined) {
                bcrypt.hash(Password, 10, (err, hash) => {
                    if (!err) {
                        user.password = hash;
                    }
                })
            }
            if (Email != undefined) {
                // check email is not used in the website
                const UserByEmail =  this.user.find(User => User.email==Email);
                if (!UserByEmail) user.email = Email;
                else return 0; //email is found before
            }
            if (Country != undefined) {
                user.country = Country;
            }

        }
        return 1;

    } 
    else return 0;

},

//get user profile public
//params: userID
me: async function(userID) {
    
    const user = await this.getUserById(userID);
    if (!user) {
        return 0;
    }


    userPublic = {}
    userPublic["_id"] = user._id;
    userPublic["displayName"] = user.displayName;
    userPublic["images"] = user.images;
    userPublic["type"] = user.type;
    userPublic["followedBy"] = user.followedBy;
    return userPublic;



},

//delete user account
//params: userID
deleteAccount: async function(userID) {
    const user = await this.getUserById(userID);
    if (!user) { return 0; }
    const User = await userDocument.find({ follow: { id: user._id } }, (err, User) => {
        if (err) return 0;
        return User;
    });
    // delete user himseld from db
    await userDocument.findByIdAndDelete(userID);
    return User;

},

//user like a track
//params: userID, trackID
likeTrack: async function(userID, trackID) {

    const user = await this.getUserById(userID);
    if (!user) { return 0; }
    const likeTrack = await Track.likeTrack(user, trackID).catch();
    return likeTrack;

},

//user unlike a track
//params: userID, trackID
unlikeTrack: async function(userID, trackID) {
    const user = await this.getUserById(userID);
    if (!user) { return 0; }
    const unlikeTrack = await Track.unlikeTrack(user, trackID);
    return unlikeTrack;
},

//artist add track to user's playlist
//params: user, trackID, playlistID
addTrack: async function(user, trackID, playlistID) {
    const Playlist = await playlist.findById(playlistID);
    const Track = await track.findById(trackID);
    if (!Playlist || !Track) { return 0; }
    if (Playlist.hasTracks) {
        user.hasTracks.push({
            trackId: trackID

        });
        await Playlist.save();
        return 1;

    }
    Playlist.hasTracks = [];
    Playlist.hasTracks.push({
        trackId: trackID

    });
    await Playlist.save();
    return 1;

},

//user add track to playlist
//params: userID, trackID, playlistID
AddTrackToPlaylist: async function(userID, trackID, playlistID) {
    const user = await this.getUserById(userID);
    const userplaylist = await user.createPlaylist.find({ playListId: playlistID });
    if (!user || userplaylist) { return 0; }
    const addTrack = await this.addTrack(user, trackID, playlistID);
    return addTrack;
},

//get user's following artist
//params: userID
getUserFollowingArtist: async function(userID) {

    const user = await this.getUserById(userID);
    if (!user.follow.length) { return 0; }
    let Artist = []
    for (let i = 0; i < user.follow.length; i++) {
        let User = await this.getUserById(user.follow[i].id);
        if (User) {
            let artists = await artistDocument.find({ userId: User._id });
            if (artists) {
                Artist.push(artists[0]);
            }
        }
    }
    return Artist;

},



//check if user email in db
//params: email
checkmail: async function(email) {

    let user = await userDocument.findOne({ email: email });
    if (!user) return false;
    return user;

},

//user forget password
//params: user
updateforgottenpassword: async function(user) {

    let password = user.displayName + "1234";
    const salt = await bcrypt.genSalt(10);
    let hashed = await bcrypt.hash(password, salt);
    user.password = hashed;
    await user.save();
    return password;

},

//user follow playlist
//params: userID, playlistID, isprivate
followPlaylist: async function(userID, playlistID, isprivate) {
    const user = await this.getUserById(userID);
    if (!user) { return 0; }
    return await Playlist.followPlaylits(user, playlistID, isprivate);

},

//user unfollow playlist
//params: userID, playlistID
unfollowPlaylist: async function(userID, playlistID) {
    const user = await this.getUserById(userID);
    if (!user) { return 0; }
    return await Playlist.unfollowPlaylist(user, playlistID);
},

//user delete playlist
//params: userID, playlistID
deletePlaylist: async function(userID, playlistID) {

    const user = await this.getUserById(userID);
    if (!user) return 0; 
    const isDelete = await Playlist.deletePlaylist(user, playlistID);
    return isDelete;

},

//get user's playlist
//params: playlistId, snapshot, userId
getPlaylist: async function(playlistId, snapshot, userId) {

    const user = await this.getUserById(userId);
    const playlist = await Playlist.getPlaylistWithTracks(playlistId, snapshot, user);
    const owner = await this.getUserById(playlist[0].ownerId);
    playlist.push({ ownerName: owner ? owner.displayName : undefined });
    return playlist;

},


//user create playlist
//params: userID, playlistName, Description
createdPlaylist: async function(userID, playlistName, Description) {

    const user = await this.getUserById(userID);
    // create new playlist
    const createdPlaylist = await Playlist.createPlaylist(userID, playlistName, Description);
    //add to user 
    if (user.createPlaylist) {
        user.createPlaylist.push({
            playListId: createdPlaylist._id,
            addedAt: Date.now(),
            isPrivate: false
        });

    } 
    else 
    {
        user.createPlaylist = [];
        user.createPlaylist.push({
            playListId: createdPlaylist._id,
            addedAt: Date.now(),
            isPrivate: false
        });
    }
    await user.save().catch();
    await Playlist.followPlaylits(user, createdPlaylist._id, false);
    return createdPlaylist;

},


//check if user can access a playlist
//params: userID, playlistId
checkAuthorizedPlaylist: async function(userID, playlistId) {

    let users = await userDocument.find({});
    let createduser;
    let playlistindex;
    let found = false;
    for (let user in users) {
        for (var i = 0; i < users[user].createPlaylist.length; i++) {
            if (users[user].createPlaylist[i].playListId == playlistId) {
                createduser = users[user];
                playlistindex = i;
                found = true;
                break;
            }
        }
        if (found) break;
    }
    if (!createduser) { return false; }
    if (createduser._id == userID) { return true; } else {
        for (var i = 0; i < createduser.createPlaylist[playlistindex].collaboratorsId.length; i++) {
            if (createduser.createPlaylist[playlistindex].collaboratorsId[i] == userID) {
                return true;
            }
        }
    }
    return false;
},


//promote user to artist
//params: userID, info, name, genre
promoteToArtist: async function(userID, info, name, genre) {

    user = await this.getUserById(userID);
    if (!user) return false;
    if (user.userType == "Artist") {
        return false;
    }
    let artist = await Artist.createArtist(user, info, name, genre);
    if (!artist) return false;
    user.userType = "Artist";
    await user.save();
    sendmail(user.email, "Congrats!! ^^) You're Now Promoted to Artist so You can Login with your Account as an Artist");
    return true;

},
//create queue for a user
//params: userID, isPlaylist, sourceId, trackId
createQueue: async function(userID, isPlaylist, sourceId, trackId) {

    const user = await this.getUserById(userID);
    const isCreateQueue = await Player.createQueue(user, isPlaylist, sourceId, trackId);
    return isCreateQueue;

},

//add track to user's queue
//params: userID, isPlaylist, sourceId, trackId
addToQueue: async function(userID, trackId, isPlaylist, sourceId) {

    const user = await this.getUserById(userID);
    const isAddQueue = await Player.addToQueue(user, trackId, isPlaylist, sourceId);
    return isAddQueue;

},

//update user's player
//params: userID, isPlaylist, sourceId, trackId
updateUserPlayer: async function(userID, isPlaylist, sourceId, trackID) {

    const user = await this.getUserById(userID);
    const queu = await Player.createQueue(user, isPlaylist, sourceId, trackID);
    if (!queu) return 0;
    const player = await Player.setPlayerInstance(user, isPlaylist, sourceId, trackID);
    if (!player) return 0;
    return 1;
},

//repeat playlist 
//params: userID, state
repreatPlaylist: async function(userID, state) {

    const user = await this.getUserById(userID);
    return await Player.repreatPlaylist(user, state);

},

//get user's queue
//params: userId
getQueue: async function(userId) {

    const user = await this.getUserById(userId);
    if (!user) return 0;
    const tracks = await Player.getQueue(user);
    if (!tracks) return 0;
    return tracks;

},

//resume playing
//params: userID
resumePlaying: async function(userID) {

    const user = await this.getUserById(userID);
    const player = await Player.resumePlaying(user);
    if (!player) return 0;
    return 1;

},

//pause playing
//params: userID
pausePlaying: async function(userID) {
    const user = await this.getUserById(userID);
    const player = await Player.pausePlaying(user);
    if (!player) return 0;
},

//shuffle playlist
//params: userId, state
setShuffle: async function(state, userId) {
    const user = await this.getUserById(userId);
    if (!user) return 0;
    const isShuffle = await Player.setShuffle(state, user);
    if (!isShuffle) return 0;
    return 1;
}
}
const UserTest=MockUser;
UserTest.user=[{
    '_id':'1',
    'displayName':'dina alaa',
    'email':'dinaalaaahmed@gmail.com',
    'password':'1223345677',
    'country':'egypt',
    'isFacebook':false
}]

test('get update',()=>{
    expect(UserTest.update('1','dai alaa')).toBeTruthy()
})
test('get user',()=>{
    expect(UserTest.getUserById('1')).toEqual({
    '_id':'1',
    'displayName':'dai alaa',
    'email':'dinaalaaahmed@gmail.com',
    'password':'1223345677',
    'country':'egypt',
    'isFacebook':false
})
})

test('get user',()=>{
    expect(UserTest.getUserById('1')).toEqual({
    '_id':'1',
    'displayName':'dai alaa',
    'email':'dinaalaaahmed@gmail.com',
    'password':'1223345677',
    'country':'egypt',
    'isFacebook':false
})
})
test('get user not fount',()=>{
    expect(UserTest.getUserById('2')).toEqual(undefined)
})