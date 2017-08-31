'use strict'

const express = require('express');
const api = express.Router();

const spotifyAuth = require('../services').spotifyAuth;
const getToken = require('../services').getToken;


api.get('/', (req, res) => {
	res.status(200).send({ message: 'Musify Pro API running...' })
});

api.get('/spotify-auth', spotifyAuth);

api.get('/callback', getToken);

module.exports = api;