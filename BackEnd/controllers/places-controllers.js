/* This file contains the middleware functions that should be reached for certain routes of places */

//to generate unique Ids for user
const { v4: uuid } = require('uuid');
//create a validation object to check for validation errors, using built in
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
//create an HttpError object
const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');
const mongooseUniqueValidator = require('mongoose-unique-validator');
const { exists } = require('../models/place');

//Using GET request : to get a place based on placeId
const getPlaceById = async (req,res,next)=>{
    const placeId = req.params.pid; // => stores id encoded in url as key value pairs { pid : 'p1' }
    //find function performs a linear search through the list

    let place; 
    try{
        place = await Place.findById(placeId);
    }
    catch(err){
        console.log(err);
        const error = new HttpError(
            'Something went wrong, could not find a place.',500
        );
        return next(error);
    }

    if(!place){
        const error = new HttpError('Could not find a place for the provided id.',404);
        return next(error);
    }
    //takes any data which can be converted to json object
    res.json({place: place.toObject( { getters: true})}); // default JS syntax when name of the id is same as name of the object { place } = { place : place}
};

//Using GET request : to get a place based on a user Id
const getPlacesByUserId =  async (req,res,next) => {
    const userId = req.params.uid;
    // find => returns the first found element
    // filter => returns an array of elements fulfilling the criteria
    let places;
    try{
        places = await Place.find({ creator: userId});
    }
    catch(err){
        console.log(err);
        const error = new HttpError(
            'Fetching places failed, please try again later',500
        );
        return next(error);
    }

    if(!places || places.length === 0){
        //reach the next error handling middleware in line
        return next(new HttpError('Could not find places for the provided user id.',404));
    }
    res.json({places: places.map(place => place.toObject({ getters: true}))});
};

//Using POST request : to create a new place
const createPlace = async (req, res,next) => {
    //errors will be an array of validation errors if any
    const errors = validationResult(req); // look into the request object 'req' and check for validation errors defined by the validationResult object
    if(!errors.isEmpty()){
        next(new HttpError('Invalid inputs passed, please check your data', 422));
    }

    const { title, description, address, creator} = req.body;

    //Get coordinates of the given location using Google's GeoCoding API
    let coordinates;
    try{
        coordinates = await getCoordsForAddress(address);
    }
    catch(error){
       return next(error);
    }
    
    const createdPlace = new Place({
        title,
        description,
        address,
        location: coordinates,
        image: 'https://www.google.com/search?q=providence&rlz=1C1CHBD_enUS759US759&source=lnms&tbm=isch&sa=X&ved=2ahUKEwiY0s_shPjpAhUmVzABHT8eBLQQ_AUoA3oECCMQBQ&biw=808&bih=744#imgrc=lxYkpNtilKz9fM',
        creator
    });

    //Try to find the user by the creator's ID
    let user;

    try{
        user = await  User.findById(creator);

    }catch(err){
        console.log(err);
        const error = new HttpError(
           'Creating place failed, please try again.',
           500 
        )
        return next(error);
    }
    //If the user doesn't exist
    if(!user){
        const error = new HttpError(
            'Could not find user for the provided id',
            500
        );
        return next(error);
    }

    try{
    //transactions : perform multiple operations in isolation of each other
    //these are built on sessions
    //following is the current session which starts when we have to create this new place
    const sess = await mongoose.startSession();
    //added a transaction on the current session
    sess.startTransaction();
    //create a new place and auto generate an id for place
    await createdPlace.save({session: sess});
    //Add place id to the user
    user.places.push(createdPlace);
    await user.save({ session: sess});
    await sess.commitTransaction(); //finally changes saved in the database

    }
    catch(err){
        console.log(err);
        const error = new HttpError(
            'Creating place failed, please try again.',
            500
        );
        console.log(err);
    return next(error);
    }

    res.status(201).json({place: createdPlace}); //201 => status success code for something new
};

//Using PATCH request : to update a current place
const updatePlace = async (req,res,next) => {
    const errors = validationResult(req); // look into the request object 'req' and check for validation errors defined by the validationResult object
    if(!errors.isEmpty()){
        return next(new HttpError('Invalid inputs passed, please check your data', 422));
    }

    const { title, description } = req.body;
    const placeId = req.params.pid;
    //update in an immutable way by first creating a copy of that place, change the neccessary fields
    //then add this copy to the entire array of places
    let place;
    try{
        place = await Place.findById(placeId);
    }catch(err){
        const error = new HttpError(
            'Something went wrong, could not update place', 500
        );
        return next(error);
    }
    
    place.title = title;
    place.description = description;

    try{
        await place.save();
    }catch(err){
        console.log(err);
        const error = new HttpError(
            'Something went wrong,could not update place.',500
        );
        return next(error);
    }

    res.status(200).json({place: place.toObject({getters: true})});
};

//Using DELETE request : to delete a current place
const deletePlace = async (req,res,next) => {
    // filter method scans through the entire array and returns fase for the place to be deleted
    const placeId = req.params.pid;

    let place;
    try{
        // populate() => to refer to document stored in other collection and to work 
        // with the data in that existing document of that other collection to do so
        place = await Place.findById(placeId).populate('creator');
    }catch(err){
        const error = new HttpError(
            'Something went wrong, could not delete place',
            500
        )
       return next(error); 
    }

    if(!place){
        const error = new HttpError('Could not find place for this id.', 404);
        return next(error);
    }

    try{
        const sess = await mongoose.startSession();
        sess.startTransaction();
        place.remove({session: sess});
        place.creator.places.pull(place);
        await place.creator.save({session: sess});
        await sess.commitTransaction();
    }catch(err){
        const error = new HttpError(
            'Something went wrong, could not delete place',
            500
        )
       return next(error); 
    }
    res.status(200).json({message: 'Deleted Place'});
};


//exporting the functions by sending a pointer to them
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;

