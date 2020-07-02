const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
//In Mongoose : Schema is the blueprint of the document we want to store
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true, minlength: 6 },
    image: { type: String, required: true},
    places: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Place'}]
});

//We can query our email as fast as possible in our database 
userSchema.plugin(uniqueValidator);
module.exports = mongoose.model('User', userSchema);