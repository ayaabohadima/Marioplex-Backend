const  {user:userDocument,artist:artistDocument,album:albumDocument,track:trackDocument,playlist:playlistDocument,category:categoryDocument} = require('../models/db');
const Playlist = require('./playlist-api');
const Album = require('./album-api');
const Track =require('./track-api')

const Player = {

    // get next and prev track from playlist or album object 
    getPrevAndNext: function(hasTracks,trackID,user){
        if (user.queue.queuIndex == -1){
            for(let i=0;i<hasTracks.length;i++){
                if(trackID == hasTracks[i].trackId){
                    console.log(trackID,hasTracks[i].trackId)
                    return {
                        "next_track":i+1<hasTracks.length?hasTracks[i+1]:undefined,
                        "prev_track":i-1>=0?hasTracks[i-1]:undefined,
                        "last_playlist_track_index": i ,
                    }
                }
            }
        }
       else{
            for(let i=0;i<hasTracks.length;i++){
                if(trackID == hasTracks[i].trackId){
                    console.log(trackID,hasTracks[i].trackId)
                    return {
                        "next_track":i+1<hasTracks.length?user.queue.tracksInQueue[user.queue.queuIndex]:undefined,
                        "prev_track":i-1>=0?hasTracks[i-1]:undefined,
                        "last_playlist_track_index": i ,
                    }
                }
            } 
       }
        return {
            "next_track":undefined,
            "prev_track":undefined,
        }   
    },

    // update user player object each time he plays new track
    setPlayerInstance: async function(user,isPlaylist,id,trackID){
    
        // first check if there is a queue
        if(user.queue.tracksInQueue){
            // get next from the queue directly
           // get next track and prev Track in playlist by checking for id greater than track id
           const {"next_track":nextTrack,"prev_track":prevTrack,"last_playlist_track_index":current_index} = this.getPrevAndNext(user.queue.tracksInQueue,trackID,user);
            user.player["next_track"] = nextTrack ? nextTrack.trackId:undefined;
            user.player["prev_track"] = prevTrack? prevTrack.trackId:undefined;
            user.player["current_track"] = trackID;
            user.player["last_playlist_track_index"] = current_index;
            await user.save();
           return 1;
        }else{
            // get next and previous form playlist or album he is currently in
    
        // if the new track the user is playing from a plylist then get track and get it's previus and next from the playlist
        if(isPlaylist){
            // get playlist
            const playlist = await Playlist.getPlaylist(id);
            console.log(playlist);
            if(!playlist) return 0; // no playlist was found
            // get next track and prev Track in playlist by checking for id greater than track id
            const {"next_track":nextTrack,"prev_track":prevTrack,"last_playlist_track_index":current_index} = this.getPrevAndNext(playlist.hasTracks,trackID,user);            // update user player info 
            user.player["next_track"] = nextTrack ? nextTrack.trackId:undefined;
            user.player["prev_track"] = prevTrack? prevTrack.trackId:undefined;
            user.player["current_track"] = trackID;
            user.player["last_playlist_track_index"] = current_index;

        }else{
            // the track is from album 
            // get album
            const album = await Album.getAlbumById(id);
            if(!album) return 0; // no playlist was found
            // get next track and prev track in album by checking for id greater than track id
            const {"next_track":nextTrack,"prev_track":prevTrack,"last_playlist_track_index":current_index} = this.getPrevAndNext(album.hasTracks,trackID,user);
             // update user player info 
             user.player["next_track"] = nextTrack ? nextTrack.trackId:undefined;
             user.player["prev_track"] = prevTrack? prevTrack.trackId:undefined;
             user.player["current_track"] = trackID;
             user.player["last_playlist_track_index"] = current_index;
             
            await user.save();
            return 1;
        }
    }
            
    },
    // add  a track to user recent tracks
    addRecentTrack: async function(user,trackID){
        if(user.playHistory){
            if(user.playHistory.length > 50)user.playHistory.pop();
            user.playHistory.unshift({
                trackId:trackID
            });
            await user.save();
            return 1;
        }else{
            user.playHistory = [];
            user.playHistory.push({
                trackId:trackID
            });
            await user.save();
            return 1;
        }
        
    },
    // clear user recent played track history
    clearRecentTracks: async function(user){
        user.playHistory = [];
        await user.save();
        return 1;
    },
    // get recent tracks played by user
    getRecentTracks:  function(user,limit){
        limit = limit || 50;
        let tracks= [];
        if(!user.playHistory) return tracks;
        for(let i=0;i<Math.min(user.playHistory.length,limit);i++) tracks.push(user.playHistory[i]);
        return tracks;
    },

    // to fill queue
    createQueue: async function(user,isPlaylist,id,trackID)
    {
       
       
       if(isPlaylist =='true') 
       {
            const playlist = await Playlist.getPlaylist(id);
            if(!playlist) return 0;
            user.queue = {};
            user.queue.index = 0;  //????
            user.queue.queuIndex = -1;
            user.queue.tracksInQueue = [];
            if(!playlist.hasTracks){
                await user.save();
                return 1;
            }
            let i=0;
            for(let track of playlist.hasTracks){
                if(trackID == track.trackId){
                        user.queue.index = i;
                }
                user.queue.tracksInQueue.push({
                    trackId : track.trackId,
                    isQueue: false

                });
                i++;
            }

            await user.save();
            user.queue.fristQueueIndex=-1;
            await user.save();
            return 1;
       }else{
        const album = await Album.getAlbumById(id);
        if(!album) return 0;
        user.queue = {};
        user.queue.index = 0;
        user.queue.queuIndex = -1;
        user.queue.tracksInQueue = [];
        if(!album.hasTracks){
            await user.save();
            return 1;
        }
        let i=0;
        for(let track of album.hasTracks){
            if(trackID == track.trackId){
                    user.queue.index = i;
            }
            user.queue.tracksInQueue.push({
                trackId : track.trackId,
                isQueue: false

            });
            i++;
        }

        await user.save();
        return 1;
       }        
    },

    addToQueue:async function(user,trackID){
       if(!user.queue){
           user.queue = {};
           user.queue.tracksInQueue = [{
               trackId:trackID,
               isQueue:true
           }];
           user.queue.queuIndex = 0;
           user.player["next_track"] = user.queue.tracksInQueue[0].trackId;
           await user.save();
           return 1;
       }else{
           if(!user.queue.tracksInQueue){
            user.queue.tracksInQueue = [{
                trackId:trackID,
                isQueue:true
            }];
            user.queue.queuIndex = 0;
            user.player["next_track"] = user.queue.tracksInQueue[0].trackId;
            user.player["last_playlist_track_index"] ++;
            await user.save(); return 1;
           }else{
               if (!user.queue.tracksInQueue[0].isQueue)
               {
               user.queue.tracksInQueue.splice(0,0,{
                   trackId:trackID,
                   isQueue:true
               });
               user.queue.queuIndex = 0;
               user.player["next_track"] = user.queue.tracksInQueue[0].trackId;
               user.player["last_playlist_track_index"] ++;
               await user.save();
               return 1;
                }
                else{
                    let index = user.queue.queuIndex;
               user.queue.tracksInQueue.splice(index,0,{
                   trackId:trackID,
                   isQueue:true
               });
               user.queue.queuIndex = index+1;
               user.player["last_playlist_track_index"] ++;
               await user.save();
               return 1;
                }

            }
       }
    },

    // to skip to next 
      skipNext:async function(user){
        
        user.player["current_track"]=user.player["next_track"]
        await user.save();
        if(user.queue.queuIndex == -1){
            user.player["prev_track"] = user.queue.tracksInQueue[user.player["last_playlist_track_index"]].trackId;
           if (user.player["last_playlist_track_index"]==user.queue.tracksInQueue.length-1)
                 user.player["last_playlist_track_index"]=0;
           else  user.player["last_playlist_track_index"] =user.player["last_playlist_track_index"] +1 ;
            
           if (user.player["last_playlist_track_index"]>=user.queue.tracksInQueue.length-1){
                user.player["next_track"] = user.queue.tracksInQueue[0].trackId;
            }
            else
                user.player["next_track"] = user.queue.tracksInQueue[user.player["last_playlist_track_index"]+1].trackId;
            await user.save();
        }
       else{
           if(user.queue.queuIndex == 0){
                user.queue.tracksInQueue.splice(0,1);
                user.player["last_playlist_track_index"]--;
                await user.save();
                if (user.player["last_playlist_track_index"]>=user.queue.tracksInQueue.length-1){                    
                    user.player["next_track"] = user.queue.tracksInQueue[0].trackId;
                }
                else
                    user.player["next_track"] = user.queue.tracksInQueue[user.player["last_playlist_track_index"]+1].trackId;

                user.queue.queuIndex = -1;
                user.player["prev_track"] = user.queue.tracksInQueue[user.player["last_playlist_track_index"]].trackId;
                await user.save();
            }
           else{
            user.queue.tracksInQueue.splice(user.queue.queuIndex,1);
            user.player["last_playlist_track_index"]--;
            await user.save();
            user.queue.queuIndex =user.queue.queuIndex-1;
            const index=user.queue.queuIndex;
            user.player["next_track"] = user.queue.tracksInQueue[index].trackId;        
             user.player["prev_track"] = user.queue.tracksInQueue[user.player["last_playlist_track_index"]].trackId;;
             await user.save();
            }
       }
        return 1;
    } ,

    //skip to previous
    skipPrevious:async function(user){
        
        if(user.player["current_track"] == user.queue.tracksInQueue[user.player["last_playlist_track_index"]].trackId){
            return 0;
            user.player["current_track"]=user.player["prev_track"];
        await user.save();
        if ( user.queue.queuIndex ==-1)
            {
                user.player["next_track"] = user.queue.tracksInQueue[user.player["last_playlist_track_index"]].trackId;        
                await user.save();
                if(user.player["last_playlist_track_index"] == 1){
                    user.player["prev_track"] = user.queue.tracksInQueue[user.queue.tracksInQueue.length-1].trackId;;
                    user.player["last_playlist_track_index"]=0;
                    await user.save();
                }
                else
                {   
                   
                    if(user.player["last_playlist_track_index"]==0){   
                        user.player["last_playlist_track_index"]=user.queue.tracksInQueue.length-1;
                        user.player["prev_track"] = user.queue.tracksInQueue[user.queue.tracksInQueue.length-2].trackId;;
                        
                    }
                    else{
                        user.player["prev_track"] = user.queue.tracksInQueue[user.player["last_playlist_track_index"]-2].trackId;;
                        user.player["last_playlist_track_index"]--;
                    }
                }
                await user.save();
                return 0;
        }
        else{
    
            user.player["next_track"] = user.queue.tracksInQueue[user.queue.queuIndex].trackId;        
            await user.save();
            if(user.player["last_playlist_track_index"] == 0){
                user.player["prev_track"] = user.queue.tracksInQueue[user.queue.tracksInQueue.length-1].trackId;
                await user.save();
            }
            else
            {  
                user.player["prev_track"] = user.queue.tracksInQueue[user.player["last_playlist_track_index"]-1].trackId;    
            }
            await user.save();
            return 0;
        }
    }
return 1;
}
}
////////////////////////////////////////////
// if there is isQueue but no one is the current TODO
// if there is no isqueue but current is add TODO
/////////////////////////////////////////////
module.exports = Player;