
/* This file is used to create the node.js server using express, and call the necessary middleware functions */


//Third party node modules imported by creating the necessary objects
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

//user defined node objects by specifying the file path
const placesRoutes = require('./routes/places-routes');
const userRoutes = require('./routes/users-routes');
const httpError = require('./models/http-error');


const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    //Setting up headers to domain  setHeader(name,value)
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, DELETE');
    next();
})

app.use('/api/places',placesRoutes); // => only url paths with /api/places/... will be forwared to placesRoutes
app.use('/api/users',userRoutes); // => only url paths with /api/users/... will be forwarded to the necessary middleware functions in userRoutes

//following middleware will only be reached if we have some request which didn't get a response before
//and that can only be a request which we don't want to handle
app.use((req, res, next) => {
    const error = new httpError('Could not find this route.', 404);
    throw error;
});

//middleware function with 4 parameters is treated as special by Express Js
app.use((error, req, res, next) => {
    //check if the response and the errors attached to it has already been sent
    if(res.headerSent){
        return next(error);
    }
    res.status(error.code || 500); //500 code -> something wrong on the server
    res.json({message: error.message || 'An unknown error occured.'});
});

//Set up a connection to the MongoDB atlas database using Mongoose 
mongoose.connect('mongodb+srv://Shreya:{password}@cluster0-iq6e9.mongodb.net/mern?retryWrites=true&w=majority')
        .then(() => {
            app.listen(5000);
        })
        .catch(err => {
            console.log(err);
        });
