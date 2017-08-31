'use strict'

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const querystring = require('querystring');

// File for storing the tokens.
// It will be in a DB in the future
const storedToken = require('../.env-tokens');

// Default Content-Type for all the request to the API
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

// Spotify API credentials
const CLIENT_ID = require('../.env-dev-local').CLIENT_ID;
const CLIENT_SECRET = require('../.env-dev-local').CLIENT_SECRET;
const REDIRECT_URI = require('../.env-dev-local').REDIRECT_URI;

//cookie for managing auth
var stateKey = 'spotify_auth_state';

// Make some chars randomly uppercase for genRandomString()
function randomUC (char) {
	let seed = Math.random();

	return Math.round(seed) == 1 ? char.toUpperCase() : char;
}

const genRandomString = (length) => {
	const result = new Array(length).fill(0);

	return result.map(() => randomUC(Math.random().toString(36).slice(2, 3))).join("");
}


function request(url, body, cb) {
	const baseUrl = 'https://accounts.spotify.com/api/';

  let reqBody = querystring.stringify(body);

  const reqConfig = {
      	url: baseUrl+url,
      	method: 'post',
        headers: {
          Authorization: 'Basic ' + (new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
        },
        data: reqBody,
        responseType: 'json'
      };

  axios(reqConfig)
  	.then(resData => cb(null, resData.data))
  	.catch(err => cb(err))
}


// Writes file with token
function storeToken(tokenData) {
	const filePath = path.join(__dirname, '..', '.env-tokens.js');

	let fileContent = `module.exports = ${JSON.stringify(resToken, null, 2)}`;
	fs.writeFile(filePath,
		fileContent,
		(err) => console.log(`.env-tokens.js created`));
}

// Request for authentication of this user
function spotifyAuth(req, res) {
  let state = genRandomString(16);
  res.cookie(stateKey, state);

  // Request (GET) for auth with with this profile scope
  let scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
      state: state
    }));
}


// Request for user token when Spotify API redirects to /callback
function getToken(req, res) {

  // The application requests the refresh and access tokens
  // after checking the state parameter
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.status(500).send({ COOKIE_ERROR: 'state_mismatch' });
  } else {
    res.clearCookie(stateKey);

    let reqBody = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
          };

    request('token', reqBody, (err, data) => {
    	if (err) res.status(500).send({ FETCH_ERROR: err });

    	const resToken = {
    			access_token: data.access_token,
    			refresh_token: data.refresh_token,
    			token_type: data.token_type,
    			scope: data.scope,
    			expires_in: data.expires_in
    		}

    	storeToken(resToken);

      res.status(200).send(resToken)
    })
  }	
}


function refreshToken(req, res) {

	const refresher = storedToken.refresh_token;

	let reqBody = {
		grant_type: 'refresh_token',
		refresh_token: refresher
	};

	request('token', reqBody, (err, data) => {
  	if (err) res.status(500).send({ FETCH_ERROR: err });

  	const resToken = {
  			access_token: data.access_token,
  			refresh_token: data.refresh_token,
  			token_type: data.token_type,
  			scope: data.scope,
  			expires_in: data.expires_in
  		}

    	storeToken(resToken);

    res.status(200).send(resToken)
	})
}

module.exports = {
	spotifyAuth,
	getToken,
	refreshToken
};