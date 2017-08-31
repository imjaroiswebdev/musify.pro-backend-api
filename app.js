'use strict'

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');


const api = require('./routes');

const port = process.env.PORT || 8000;

const app = express();

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());

app.use(cookieParser());

app.use('/musifypro-api', api);


app.listen(port, () => {
	console.log(`Musify Pro backend API running in port ${port}...`)
})