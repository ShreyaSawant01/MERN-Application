const mongoose = require('mongoose');

//In Mongoose : Schema is the blueprint of the document we want to store
const Schema = mongoose.Schema;

const placeSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    // images are stored in the form of url pointing to them in the database
    image: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true},
        lng: { type: Number, required: true}
    },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User'} //ref to connect different schemas
});

module.exports = mongoose.model('Place', placeSchema);