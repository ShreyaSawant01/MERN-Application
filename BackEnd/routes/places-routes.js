/*This file contains the routes (create, update, delete) for places in our app */


//will have to import express again
const express = require('express');
//special object by using predefined function Router
const router = express.Router();
//import express validator object
const { check } = require('express-validator'); // check method will return a new middleware configured for validation requirements

//onject to access the middleware functions that control the places routes defined in this file
const placesControllers = require('../controllers/places-controllers');

//to find a place by place ID => /api/places/pid
router.get('/:pid',placesControllers.getPlaceById);

//to find a place by user ID => /api/places/user/uid
router.get('/user/:uid',placesControllers.getPlacesByUserId);

//to create a new place => /api/places/
//check method needs to be executed, parameters should be the fields to be validated
//on the result returned by the function call a chain a set of functions
router.post('/', [
                   check('title').not().isEmpty(),
                   check('description').isLength({min: 5}),
                   check('address').not().isEmpty()
                ], placesControllers.createPlace); 

//to update a place by place ID => /api/places/pid
router.patch('/:pid',[
                    check('title').not().isEmpty(),
                    check('description').isLength({min: 5}),
                    ],placesControllers.updatePlace);

//to delete a place by place ID => /api/places/pid
router.delete('/:pid',placesControllers.deletePlace);


//exporting the router
module.exports = router;
