const { user: userDocument, artist: artistDocument, album: albumDocument, track: trackDocument, playlist: playlistDocument, category: categoryDocument } = require('../models/db');


// initialize db 
const connection = require('../db-connection/connection');
const User = require('./user-api');
const track = require('./track-api');
const playlist = require('./playlist-api');
/** @namespace */
const Browse = {
    /**
     * get category by id
     * @param {string} categoryID - the id of the category
     * @returns {Object} 
     */
    
    getCategoryById: async function(categoryID) {

        let category = await categoryDocument.findById(categoryID, (err, category) => {
            if (err) return 0;
            return category;
        }).catch((err) => 0);
        return category;

    },
    /**
     * get categories
     * @returns {Array<object>}
     */

    getCategoryies: async function() {

        let category = await categoryDocument.find({}, (err, category) => {
            if (err) return 0;
            return category;
        }).catch((err) => 0);
        return category;

    }
}
module.exports = Browse;