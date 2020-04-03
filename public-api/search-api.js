const  {user:userDocument,artist:artistDocument,album:albumDocument,track:trackDocument,playlist:playlistDocument,category:categoryDocument} = require('../models/db');
var FuzzySearch = require('fuzzy-search');


// initialize db 
const artistApi=require('./Artist-api');
const connection=require('../DBconnection/connection');
const user_api=require('./user-api');
const track=require('./track-api');
const artist_api=require('./Artist-api');
const album_api=require('./album-api');

const Search =  {
    getUsers  : async function(){
        let user = await userDocument.find({} ,(err,user)=>{
            if(err) return 0;
            return user;
        }).catch((err)=> 0);
        return user;

    },
    getAlbums : async function(){
        let album = await albumDocument.find({} ,(err,album)=>{
            if(err) return 0;
            return album;
        }).catch((err)=> 0);
        return album;
    },
    getUserByname  : async function(name){
        
        
        const user= await this.getUsers();
        if(user.length==0)return 0;
        return Fuzzysearch(name,'displayName',user);
        
            
    },
    getTop :async function(Name){
        
        const artist= await this.getArtistProfile(Name);
        console.log(artist)
        if(artist){
            return artist[0]._id
        }
        return 0;
    },
    getPlaylists : async function(){
        let playlist = await playlistDocument.find( {isPublic:true} ,(err,playlist)=>{
            if(err) return 0;
           return playlist;
        }).catch((err)=> 0);
        return playlist;
    },
    getTracks :async function(){
        let track = await trackDocument.find({} ,(err,track)=>{
            if(err) return 0;
           return track;
        }).catch((err)=> 0);
        return track;
    },
    exactmatch: async function (array,name){
        let firstname;
    for(let i=0;i<array.length;i++){
    subname=array[i].Name.split(' ');
    firstname=subname[0];
    if(firstname==name){
        return array[i]._id;
    }
    
    }
    return 0;
    },
    
    getAlbum  : async function(albumName,groups,country,limit,offset){
            
            var allalbum;
            let allartists=await artistDocument.find({});
            let artist=await this.exactmatch(allartists,albumName);
            console.log(artist);
            if(artist){

                allalbum=await artistApi.getAlbums(artist,groups,country,limit,offset);

            }
            else{
                allalbum= await this.getAlbums();
                if(allalbum.length==0) return allalbum;
                allalbum= Fuzzysearch(albumName,'name',allalbum);  
            
            }
            Album=[]
            for(let i=0;i<allalbum.length;i++){
                let albums=await album_api.getAlbumArtist(allalbum[i]._id);
                if(albums){
                    album={}
                    album["_id"]=albums.Album._id
                    album["name"]=albums.Album.name
                    album["images"]=albums.Album.images
                    album["type"]=albums.Album.type
                    artist={}
                    if(albums.Artist){
                    artist["_id"]=albums.Artist._id
                    artist["name"]=albums.Artist.Name
                    artist["images"]=albums.Artist.images
                    artist["info"]=albums.Artist.info
                    artist["type"]=albums.Artist.type
                    artist["genre"]=albums.Artist.genre
                    }
                    Album.push({album,artist});
                }
            }
           // console.log(Album);
            return Album;
    
    
    },
    getTrack : async function(Name){
        
            var Track;
            
            let allartists=await artistDocument.find({});
            let artist=await this.exactmatch(allartists,Name);
            if(artist){

                Track=await artistApi.getTracks(artist);

            }
            else{
                const track= await this.getTracks();
                if(track==0)return track;
                Track= Fuzzysearch(Name,'name',track); 
            }
            
            trackInfo=[]
            for( let i=0;i<Track.length;i++){
                let artist=await artist_api.getArtist(Track[i].artistId)
                Artist={}
                if(artist){
                    
                    Artist["_id"]=artist._id
                    Artist["name"]=artist.Name
                    Artist["images"]=artist.images
                    Artist["info"]=artist.info
                    Artist["type"]=artist.type
                }
                Album={}
                let album=await album_api.getAlbumById(Track[i].albumId)
                if(album){
                    
                    Album["_id"]=album._id
                    Album["name"]=album.name
                    Album["images"]=album.images
                    Album["type"]=album.type
                }
                tracks={}
                tracks["_id"]=Track[i]._id
                tracks["name"]=Track[i].name
                tracks["type"]=Track[i].type
                tracks["images"]=Track[i].images
                trackInfo.push({track:tracks,artist:Artist,album:Album});
            
        }
        return trackInfo;
            

    },
    getTopResults :async function(Name){
        console.log("topres");
        const artist= await this.getTop(Name);
        if(artist){
            let artist=await this.getArtistProfile(Name)
            return artist[0]
        }
        let track=await this.getTrack(Name);
        if(track.length!=0){
            console.log("track");
        return track[0];
        }
        let album=await this.getAlbum(Name);
        console.log(album);
        if(album.length!=0){
            console.log("album");
        return album[0];
        }
        let playlist=await this.getPlaylist(Name);
        if(playlist.length!=0){
            console.log("playlist");
        return playlist[0];
        }

    },
    getArtistProfile  : async function(name){
        

        let ArtistInfo=[];

        let User = await this.getUserByname(name);
        if(User.length==0)return 0;
        else{
            for( let i=0;i<User.length;i++){
                if(User[i].userType=="Artist"){

                   let artist= await this.getArtist(User[i]._id);
                   if(artist){
                       Artist={}
                       Artist["_id"]=artist[0]._id
                       Artist["name"]=artist[0].Name
                       Artist["images"]=artist[0].images
                       Artist["info"]=artist[0].info
                       Artist["type"]=artist[0].type
                       Artist["genre"]=artist[0].genre
                       ArtistInfo.push(Artist)

                   }

                }
            }
            if(ArtistInfo.length==0)return 0;
            return ArtistInfo;
        
        }
    
    },
    getArtist  : async function(artistID){
        let artist = await artistDocument.find({userId:artistID} ,(err,artist)=>{
            if(err) return 0;
           return artist;
        }).catch((err)=> 0);
        return artist;
    },
    
    getUserProfile  : async function(name){
        
        UserInfo=[]
        let User = await this.getUserByname(name);
        if(User.length==0)return User;
        else{
            console.log(User);
            for( let i=0;i<User.length;i++){
                if(User[i].userType=="Artist"){
                    continue;
                }
                else{

                    user={}
                    user["_id"]=User[i]._id
                    user["displayName"]=User[i].displayName
                    user["images"]=User[i].images
                    user["type"]=User[i].type
                    UserInfo.push(user)
                }
            }
            
            return UserInfo;
        }
    
    },
    getPlaylist  : async function(Name){

        let playlist= await this.getPlaylists();
        if(playlist.length==0) return playlist;
        playlist= Fuzzysearch(Name,'name',playlist);
        playlistInfo=[]
        for( let i=0;i<playlist.length;i++){
                let User=await user_api.getUserById(playlist[i].ownerId)
                user={}
                if(User){
                    user["_id"]=User._id
                    user["displayName"]=User.displayName
                    user["images"]=User.images
                    user["type"]=User.type
                }
                Playlist={}
                Playlist["_id"]=playlist[i]._id
                Playlist["name"]=playlist[i].name
                Playlist["type"]=playlist[i].type
                Playlist["images"]=playlist[i].images
                playlistInfo.push({playlist:Playlist,owner:user})
            
        }
        return playlistInfo;
    

    }
}
module.exports=Search;

function search(name,field,schema){
    const searcher = new FuzzySearch(schema, [field], {
        caseSensitive: false, sort:true
      });
      const users = searcher.search(name);
      return users;
}

function Fuzzysearch(name,field,schema){
    Results=[]
    subName=name.split(' ');
    let results = search(name,field,schema);
    Results=Results.concat(results);
    for( let i=0;i<subName.length;i++){
        results = search(subName[i],field,schema);
        Results=Results.concat(results);
    }
    return removeDupliactes(Results);
}

const removeDupliactes = (values) => {
        
        let newArray = []; 
        let uniqueObject = {}; 
        for (let i in values) { 
              objTitle = values[i]['_id']; 
              uniqueObject[objTitle] = values[i]; 
        } 
          
        for (i in uniqueObject) { 
            newArray.push(uniqueObject[i]); 
        } 
        return newArray;
}
