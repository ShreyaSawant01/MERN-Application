/* This file contains all the routes for user functionality */

//will have to import express again
const express = require('express');

const { check } = require('express-validator'); // check method will return a new middleware configured for validation requirements
//special object by using predefined function Router
const router = express.Router();

const usersController = require('../controllers/users-controllers');
const fileUpload = require('../middleware/file-upload');

//to find a user by user ID => /api/places/pid
router.get('/',usersController.getUsers);

//to sign up a new user
router.post('/signup',
                fileUpload.single('image'),
                [
                        check('name').not().isEmpty(),
                        check('email')
                        .normalizeEmail() // => Test@Test.com --> test@test.com
                        .isEmail(), // => valid email or not
                        check('password').isLength({ min : 6})
                        ],usersController.signup);

//to login a new user if credentials match, throw error message otherwise
router.post('/login',usersController.login);

module.exports = router;
