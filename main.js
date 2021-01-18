const config = require('./config/config.json')
const express = require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const serversHandler = require('./handlers/servers')
const login = require('./handlers/login/login')
const homepage = require('./handlers/homepage/get')
const schedule = require('./handlers/schedule/get')
const weekSchedule = require('./handlers/schedule/week')
const rangeSchedule = require('./handlers/schedule/range')
const cors = require('cors');

app = express();
app.use(bodyParser.json());
app.use(cors());

global.config = config;

// Routes

app.route('/api/v1/servers')
    .get(serversHandler.serversHandler);

app.route('/api/v1/login')
    .post(login.signIn)

app.route('/api/v1/homepage')
    .post(homepage.homepage)

app.route('/api/v1/schedule')
    .post(schedule.schedule)

app.route('/api/v1/schedule/withdate/')
    .post(weekSchedule.schedule)

app.route('/api/v1/schedule/range/')
    .post(rangeSchedule.schedule)

// 404 error

app.get('*', function(req, res){
    res.status(404).json({'status': false, 'cause': "not found"});
});

app.listen(port);
console.log("Listening on port "+port);