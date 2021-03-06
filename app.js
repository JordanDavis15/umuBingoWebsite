/*-------------------------------------------------------------------
|  File: app.js
|
|  Purpose:  This file contains the code that creates the server
|            and it houses all logic for routing requests.
| 
|
|  Author: Jordan Davis (4/27/2022)
|
|
|  Change Log:
|
*-------------------------------------------------------------------*/

var express = require('express');
var cookieParser = require('cookie-parser');

const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const fs = require('fs');
const portNum = 5000;

var app = express();
var loginInfo = Array();
var pool = null; //set pool to null until init
var date = new Date();

app.use(cookieParser());

try{
    //test to see if env vars can be used
    if (process.env.POSTGRES_USER == undefined || process.env.POSTGRES_HOST == undefined ||
        process.env.POSTGRES_DB == undefined || process.env.POSTGRES_PASSWORD == undefined ||
        process.env.POSTGRES_PORT == undefined){
        throw error; //env vars cannot be used
    }
    pool = new Pool({
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: process.env.POSTGRES_PORT,
    });
}
catch{
    console.log('No env vars found, reverting to dbinfo.txt file');
    fs.readFile(path.join(__dirname, '/dbinfo.txt'), 'utf8' , (err, data) => {
        if (err) {
          console.error(err)
          return
        }
        loginInfo = data.split('\n'); //split data based on new line
        for(i = 0; i < loginInfo.length; i++){
          loginInfo[i] = loginInfo[i].replace('\r', '');   //remove carriage return char if exists
        }
        console.log(loginInfo[0]);
        pool = new Pool({
          user: loginInfo[0],
          host: loginInfo[1],
          database: loginInfo[2],
          password: String(loginInfo[3]),
          port: loginInfo[4],
        });
      });
}


//app.use(bodyParser.urlencoded({ extended: false }))
//app.use(bodyParser.json())

// middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//serve static resources
//app.use(bodyParser.urlencoded({extended: false})); app.use(express.static(path.join(__dirname, '/public')));
app.use('/public', express.static('./public'));

//used in testing service-worker on local machine
//app.use("./service-worker.js", express.static(__dirname + './service-worker.js'));


/************************/
/*routes logic          */
/************************/

//route to login page
app.get('/', function (req, res) {
    //clear all cookies if they exist
    var cookies = req.cookies;
    if(req.cookies != undefined){
        console.log('clearing cookies');
        for (var key of Object.keys(cookies)) {
            console.log("clearing cookie: " + key); // + " -> " + cookies[key])
            res.clearCookie(key);
        }
    }
    //send login page
    res.sendFile(path.join(__dirname, '/login.html'));
});

//route to Login Page (alternate)
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

//route to index Page -- this is the board
app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

//route to scoreboard
app.get('/scores', (req, res) => {
    res.sendFile(__dirname + '/scores.html');
});

app.get('/faq', (req, res) => {
    res.sendFile(__dirname + '/faq.html');
});

//route to send service worker to enable pwa support
app.get('/service-worker.js', (req, res) => {
    res.sendFile(__dirname + '/service-worker.js');
});


/************************/
/*post logic            */
/************************/

//logic to handle post reqs from login.html
app.post('/login', function(req, res) {
    var body = req.body;
    if(body.SOLaddr != undefined || body.SOLaddr == ' '){
        
        //update users table
        (async () => {
            console.log('adding user address and date to users table');
            var data = await addUserToDB(cleanInput(body.SOLaddr), new Date().toLocaleDateString()); //2nd argument gets current system date
            console.log('response from adduser call' + data);
            if(data == -1){
                res.sendFile(path.join(__dirname, '/scores.html'));
                //res.sendFile(path.join(__dirname, '/login.html'));
            }
            else{
                body.SOLaddr = cleanInput(body.SOLaddr);
                res.cookie('userid', body.SOLaddr);                   //sets userid cookie to their SOL Wallet address that was entered
                res.sendFile(path.join(__dirname, '/category.html'));
            }
        })(); 
    }
});

//logic to handle post reqs from category.html
app.post('/category', function(req, res) {
    var selectedOption = req.body.selected;
    if(req.cookies.userid == undefined){
        res.sendFile(path.join(__dirname, '/login.html'));
    }
    else if(selectedOption != 'getcategories'){
        selectedOption = cleanInput(selectedOption);
        console.log('category selected = ' + selectedOption);
        (async () => {
            console.log('updating user : ' + req.cookies.userid + 'start time');
            await storeStartTime(req.cookies.userid, new Date().toLocaleDateString()); //2nd argument gets current system date
        })(); 
        res.cookie('category', selectedOption);
        res.send(JSON.stringify('good'));
    }
    else{
        //self calling async function to gather data from getCategoriesFromDB async call
        (async () => {
            console.log('DBACCESS:=> requested database data')
            var cats = await getCategoriesFromDB();
            console.log(cats);
            res.send(JSON.stringify(cats));
        })();
    }
  });

  //logic to handle board element selection
  app.post('/selection', function(req, res) {
    if(req.cookies.userid == undefined || req.cookies.userid == ' '){
        res.sendFile(path.join(__dirname, '/login.html'));
    }
    else{
        var body = req.body;
        console.log('user: ' + req.cookies.userid + ' selected: ' + body[body.length-1].selected);

            //insert logic to determine correctness here
            //below is sample setting of correctness
            (async () => {
                console.log('DBACCESS:=> verify correctness of selected answer')
                var isCorrect = await checkUserAnswer(body[body.length-2].question, body[body.length-1].selected);
                console.log('iscorrect result'+isCorrect);
                body.push({'correctness': isCorrect}) //true denotes correct, false denotes incorrect

                if(isCorrect){
                    //insert logic to determine bingo achieved here
                    //below is sample setting of gameOver
                    var tmpBody = req.body;
                    for(i = 0; i < tmpBody.length; i++){
                        if(tmpBody[i].name == tmpBody[tmpBody.length-2].selected){
                            tmpBody[i].name = 'X';
                        }
                    }

                    var gameOver = isGameOver(tmpBody);
                    body.push({'gameOver': gameOver}) //'X' denotes over, ' ' denotes bingo not achieved yet
                    console.log('after game over check');

                    if(gameOver == 'X'){
                        (async () => {
                            gameOverDBUpdate(req.cookies.userid, new Date().toLocaleDateString());
                        })();

                        (async () => {
                            totalGameTimeDBUpdate(req.cookies.userid);
                        })();
                    }
                }
            
                //console.log(req.body);
                res.send(JSON.stringify(req.body));
            })();
    }
  });

  //logic to handle post reqs for questions and answers
  app.post('/getans', function(req, res){
    if(req.body.questionsAndAnswers == 'get'){
        (async () => {
            console.log('DBACCESS:=> requested question and answer data')
            var qAndAs = await getQuestionsAndAnswersFromDB(req.cookies.category);
            res.send(JSON.stringify(qAndAs));
        })();
    }
  });


  //logic to handle post reqs from category.html
  app.post('/scores', function(req, res) {
    //self calling async function to gather lowest 15 times from database
    (async () => {
        console.log('DBACCESS:=> requested database data: scores')
        var scores = await getScoresFromDB();
        console.log(scores);
        res.send(JSON.stringify(scores));
    })();
  });


/************************/
/*server creation       */
/************************/

//creates the server and listens for connections on port 5000
var server = app.listen(portNum, function () {
    console.log('Node server is running...');
});


/************************/
/*database accesses     */
/************************/

//adds user address and playing date to users table
async function addUserToDB(addr, login_date) {
    try{
        await pool.query("INSERT INTO users (wallet_address, login_date) VALUES (" + '\'' + addr + '\'' + ", " + '\'' + login_date + '\'' + ")");
    }
    catch(err){
        console.log('ERROR!!');
        return -1;
    }
}

async function storeStartTime(addr, login_date){
    try{
        await pool.query("UPDATE users SET start_time = " + new Date().getTime() + " WHERE wallet_address = " + '\'' + addr + '\'' + "AND login_date = " + '\'' + login_date + '\'' );
    }
    catch(err){
        console.log(err);
        console.log('ERROR!!');
        return -1;
    }
}

//returns array of categories from database
async function getCategoriesFromDB() {
    try{
        var results = await pool.query("SELECT DISTINCT category from question");
        var cats = [];
        for(i = 0; i < results.rows.length; i++){
            cats.push(results.rows[i].category);
        }
        return cats;
    }
    catch(err){
        console.log(err);
        console.log('ERROR!!');
        return -1;
    }
}

//returns array of questions and answers from database
async function getQuestionsAndAnswersFromDB(cat) {
    try{
        var results = await pool.query("SELECT DISTINCT text, answer from question where category = " + '\'' + cat + '\'');
        var questions = [];
        var answers = [];
        var qAndAs = [];
        for(i = 0; i < results.rows.length; i++){
            //console.log(results.rows[i]);
            questions.push(results.rows[i].text);
            answers.push(results.rows[i].answer);
            //qAndAs.push(results.rows[i].text + '`' + results.rows[i].answer); //using ` char as delimiter
        }
        questions.sort(() => Math.random() - 0.5);
        answers.sort(() => Math.random() - 0.5);
        for(i = 0; i < questions.length; i++){
            qAndAs.push(questions[i] + '`' + answers[i]); //using ` char as delimiter
        }
        return qAndAs;
    }
    catch(err){
        console.log(err);
        console.log('ERROR!!');
        return -1;
    }
}

//checks if selected answer is correct or not
async function checkUserAnswer(question, answer){
    try{
        question = queryFix(question);
        console.log("SELECT COUNT(*) FROM question where text = " + '\"' + question + '\"' + ' AND answer = ' + '\"' + answer + '\"');
        var results = await pool.query("SELECT COUNT(*) FROM question where text = " + '\'' + question + '\'' + ' AND answer = ' + '\'' + answer + '\'');
        if(results.rows[0].count > 0){ //means the selected answer is correct
            return true;
        }
        return false;
    }
    catch(err){
        console.log(err);
        console.log('ERROR!!');
        return -1;
    }
}

// stores game completion time and calculates total game time
async function gameOverDBUpdate(addr, completion_date){
    try{
        await pool.query("UPDATE users SET completion_time = " + new Date().getTime() + " WHERE wallet_address = " + '\'' + addr + '\'' + "AND login_date = " + '\'' + completion_date + '\'' );
    }
    catch(err){
        console.log(err);
        return -1;
    }
}

async function totalGameTimeDBUpdate(addr){
    try{
        var times = await pool.query("SELECT start_time, completion_time FROM users WHERE wallet_address = " + '\'' + addr + '\'' + " AND login_date = " + '\'' + new Date().toLocaleDateString() + '\'')
        console.log(times.rows[0].start_time + ', ' + times.rows[0].completion_time);
        var totalGameTime = times.rows[0].completion_time - times.rows[0].start_time;
        await pool.query("UPDATE users SET game_time = " + totalGameTime + " WHERE wallet_address = " + '\'' + addr + '\'' + "AND login_date = " + '\'' + new Date().toLocaleDateString() + '\'' );
    }
    catch(err){
        console.log(err);
        return -1;
    }
}

//returns array of lowest 15 times from database
async function getScoresFromDB() {
    try{
        var results = await pool.query("SELECT wallet_address FROM users WHERE game_time IS NOT NULL AND login_date = " + '\'' + new Date().toLocaleDateString() + '\'' + " ORDER BY game_time");
        var scores = [];
        var maxResults = 15;
        if(results.rows.length < maxResults){
            maxResults = results.rows.length;
        }
        for(i = 0; i < maxResults; i++){
            scores.push(results.rows[i].wallet_address);
        }
        return scores;
    }
    catch(err){
        console.log(err);
        console.log('ERROR!!');
        return -1;
    }
}

//=========================================
// game over check
//=========================================

function isGameOver(data){
    var rowCounter = 0;
    var columnCounter = 0;

    // for(i = 0; i < data.length; i++){
    //     console.log(data[i].name);
    // }
    
    //row checker
    for(i = 0; i < data.length; i++){
        //if next row, reset rowCount
        if(i > 0 && i % 5 == 0){
            rowCounter = 0;
        }

        if(data[i].name != undefined){
            //checks for multiple correct answers in a row
            if(data[i].name == 'X'){
                rowCounter++
                console.log('rowCounter = ' + rowCounter)
                if (rowCounter == 5){
                    return 'X';
                }
            }
        }
        else{
            break; //checked whole board, jump out of loop when reached additional req info in body
        }
    }
    
    //column checker
    for(i = 0 ; i < 5; i++){
        for(j = 0; j < data.length; j++){
            if(data[j].name != undefined){
                if(data[j].name == 'X' && j % 5 == i){
                    columnCounter++
                    console.log('columCounter, i, j = ' + columnCounter + ',' + i + ',' + j);
                }
            }
        }
        if(columnCounter == 5){
            return 'X';
        }
        else{
            columnCounter = 0;
        }
    }
    // console.log('columCounter = ' + columnCounter);
    // console.log('rowCounter = ' + rowCounter);
    // if(columnCounter == 5 || rowCounter == 5){
    //     console.log('!!!!!!!!!!!WINNER!!!!!!!!!!!!!!!');
    //     return 'X'; //winner
    // }
    return ' '; //not a winner
}

//=========================================
// SQL input cleaning / reformatting
//=========================================

//will remove all invalid chars from input and return cleaned string
function cleanInput(string){
    string = string.replaceAll(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    return string;
}

//will fix all instances of inserting a string into a postgres db where two escape chars are need for the two single quotes
function queryFix(string){
    return string.replaceAll('\'', '\'\'');
}

