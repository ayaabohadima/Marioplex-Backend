const  {user:userDocument,artist:artistDocument,album:albumDocument,track:trackDocument,playlist:playlistDocument,category:categoryDocument} = require('../models/db');


// initialize db 
const connection=require('../DBconnection/connection');
const User=require('./user-api');
const track=require('./track-api');
const artist=require('./Artist-api');
 const Album =  {
    
    addTrack  : async function(AlbumId,Track){     
        const album = await albumDocument.findById(AlbumId);
        album.hasTracks.push({
            trackId:Track._id
        });
       await album.save();
    },
    getAlbumById  : async function(albumID){
        
            // connect to db and find album with the same id then return it as json file
            // if found return album else return 0
            let album = await albumDocument.findById(albumID,(err,album)=>{
                if(err) return 0;
                return album;
            }).catch((err)=> 0);
            return album;
            

    },
    getAlbumArtist : async function(albumID){
        
        // connect to db and find album with the same id then return it as json file
        // if found return album else return 0
        let album = await this.getAlbumById(albumID);
        console.log(album);
        if(album){
            let Artist= await artist.getArtist(album.artistId);
            if(Artist){
                return {Album:album,Artist:Artist};
            }
            else {
                return {Album:album}
            }
        }
        else{
            return 0;
        }
            
        

    },
    findIndexOfTrackInAlbum: async function(trackId,album) {
        for(let i=0;i <album.hasTracks.length;i++ ){
            if(album.hasTracks[i].trackId==trackId)   return i;     
        }
        return -1
    },
    getAlbums  : async function(albumIds){
        
        // connect to db and find album with the same id then return it as json file
        // if found return album else return 0
        
        var Album=[]
        if(albumIds==undefined)return 0;
        for(var i=0;i <albumIds.length;i++){
            var album=await this.getAlbumById(albumIds[i]);
            if(album){
                Album.push(album)
            }
        }
        if(Album.length>0){
            AlbumWithArtist=[]
            for(let i=0;i<Album.length;i++){
               let Artist= await artist.getArtist(Album[i].artistId);
               if(Artist){
                AlbumWithArtist.push({Album:Album[i],Artist:Artist});
               }

            }
            return AlbumWithArtist;
        
        }
        else{
            return 0;
        }
        

    },
    getTracksAlbum  : async function(albumID,user){
        
        // connect to db and find album with the same id then return it as json file
        // if found return album else return 0
        const Tracks=[];
        const album = await this.getAlbumById(albumID);
        if(!album){
            return 0;
        }
        else{

            for(i=0;i<album.hasTracks.length;i++){
            var Track=await track.getFullTrack(album.hasTracks[i].trackId,user);
            if(Track){
                Tracks.push(Track);
            }
        }
        }
        if(Tracks.length==0){
            return 0;
        }
        return Tracks;

        

    },

    

 
    

    //user like track by track-id
    //params : user , track-id
    checkIfUserSaveAlbum: function(user,albumID){
        
        const albumsUserSaved = user.saveAlbum;
        // if user.like.contains({track_id:track.track_id})
        if(albumsUserSaved){
           return  albumsUserSaved.find(album => album.albumId == albumID);
        }
        return 0;
    },
       //user save track by album-id
    //params : user , album-id
    saveAlbum : async function(user,albumID){
        // check if user already saved the album
        // if not found then add album.album_id to user likes and return the updated user
        // else return 0 as he already saved the album
            if(albumID==undefined) return 2;
            let albums=[];
            for(let j=0;j<albumID.length;j++){
                let album=await this.getAlbumById(albumID[j]);
                if(album){
                    albums.push(albumID[j]);
                }
            }
            if(albums.length==0){return 2;}
            let count=0;
            for(let i=0;i<albums.length;i++){
                if(this.checkIfUserSaveAlbum(user,albums[i])==undefined){
                    if(user.saveAlbum){
                        user.saveAlbum.push({
                            albumId: albums[i],
                            savedAt: Date.now()
                        });
                        await user.save();
                        
                        
                    }
                 else{   user.saveAlbum = [];
                    user.saveAlbum.push({
                        albumId: albums[i],
                        savedAt: Date.now()
                    });
                    await user.save();
                }
                 }
                 else{count++;}
                }
                if(count==albums.length){
                    return 0;
                }
                return 1;

    },
    unsaveAlbum : async function(user,albumID){
        // check if user already saved the album
        // if not found then add album.album_id to user likes and return the updated user
        // else return 0 as he already saved the album
        let found=false;
        if(albumID==undefined) return 0;
        for(let j=0;j<albumID.length;j++){
            if(this.checkIfUserSaveAlbum(user,albumID[j])){
                found=true;
                for(let i=0;i <user.saveAlbum.length;i++ ){
                    if(user.saveAlbum[i].albumId == albumID[j]){
                        user.saveAlbum.splice(i,1);
                    }
                }
                await user.save().catch();
            }
            else{
                if((!found&&(j==(albumID.length-1)))||(albumID.length==1)){
                    return 0;
                }
            }     
        }
        return 1;
    }



}





module.exports = Album;