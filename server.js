
const forgpass=require('./routes/Forgpass-route');
const connection=require('./DBconnection/connection');
const express = require('express');
const app=express();
//connect to database
connection(app);
const cors = require('cors');
const bodyparser = require('body-parser');
const logger = require('morgan');
const passport = require('passport');
const Artist=require('./routes/Artist-route');
const login=require('./routes/login');
const signup=require('./routes/signup');
require('./config/passport');


app.use(cors());
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
app.use(logger('dev'));
app.use(passport.initialize());

app.use(Artist);
app.use(login);
app.use(signup);
app.use(forgpass);


//connect to db before test run
const API_PORT= process.env.API_PORT||3000;

app.use(function(error,req,res,next){
    res.status(500);
    res.send({error:error.message});
    
});
app.listen(process.env.port||5000,function(){
    console.log('listening for a request');
});

module.exports = app;