'use strict'

const express = require('express');
const api = express.Router();

const spotifyAuth = require('../services').spotifyAuth;
const getToken = require('../services').getToken;
const refreshToken = require('../services').refreshToken;


api.get('/', (req, res) => {
	res.status(200).send({ message: 'Musify Pro API running...' })
});

api.get('/spotify-auth', spotifyAuth);

api.get('/callback', getToken);

api.get('/refresh-token', refreshToken);

module.exports = api;