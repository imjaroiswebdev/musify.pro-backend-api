'use strict'

const axios = require('axios');
const querystring = require('querystring');

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

    const body = querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
          });

    const reqConfig = {
        	url: 'https://accounts.spotify.com/api/token',
        	method: 'post',
          headers: {
            Authorization: 'Basic ' + (new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
          },
          data: body,
          responseType: 'json'
        };

    axios(reqConfig)
    	.then(resData => {
    		const { data } = resData;


    		const resToken = {
    			access_token: data.access_token,
    			refresh_token: data.refresh_token,
    			token_type: data.token_type,
    			scope: data.scope,
    			expires_in: data.expires_in
    		}

        res.status(200).send(resToken)
    	})
    	.catch(err => {
        res.status(500).send({ FETCH_ERROR: err })   		
    	})
  }	
}

module.exports = {
	spotifyAuth,
	getToken
};