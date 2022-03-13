var express = require('express');
var cookieParser = require('cookie-parser');

const path = require('path');
const bodyParser = require('body-parser');
const { Pool } = require('pg')
const fs = require('fs')

var app = express();
var loginInfo = Array();
var pool = null; //set pool to null until init
var time = new Date();

app.use(cookieParser());

try{
    //test to see if env vars can be used
    if (process.env.POSTGRES_USER == undefined || process.env.POSTGRES_HOST == undefined ||
        process.env.POSTGRES_DB == undefined || process.env.POSTGRES_PASSWORD == undefined ||
        process.env.POSTGRES_DEV_PORT == undefined){
        throw error; //env vars cannot be used
    }
    pool = new Pool({
        user: process.env.POSTGRES_USER,
        host: process.env.POSTGRES_HOST,
        database: process.env.POSTGRES_DB,
        password: process.env.POSTGRES_PASSWORD,
        port: process.env.POSTGRES_DEV_PORT,
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


/************************/
/*routes                */
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

  //route to Login Page (alternate)
app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

//logic to handle post reqs from login.html
app.post('/login', function(req, res) {
    var body = req.body;
    if(body.SOLaddr != undefined || body.SOLaddr == ' '){
        body.SOLaddr = cleanInput(body.SOLaddr);
        res.cookie('userid', body.SOLaddr);                   //sets userid cookie to their SOL Wallet address that was entered

        //update users table
        console.log('adding user address and date to users table');
        addUserToDB(body.SOLaddr, new Date().toLocaleDateString()) //2nd argument gets current system date


        res.sendFile(path.join(__dirname, '/category.html'));
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

//logic to handle post reqs from index.html
app.post('/main', function(req, res) {
    var body = req.body;
    console.log(body); 

    if(req.cookies.userid == undefined){
        res.sendFile(path.join(__dirname, '/login.html'));
    }
    
    // if(body.SOLaddr != undefined && req.cookies.category == undefined){ //&& req.cookies.category == undefined){                    //check to see if user has selected a category yet
    //     console.log('SOL address entered = ' + body.SOLaddr); //access the value of the json like this
    //     body.SOLaddr = cleanInput(body.SOLaddr);
    //     res.cookie('userid', body.SOLaddr);                   //sets userid cookie to their SOL Wallet address that was entered

    //     //update users table
    //     console.log('adding user address and date to users table');
    //     addUserToDB(body.SOLaddr, new Date().toLocaleDateString()) //2nd argument gets current system date


    //     res.sendFile(path.join(__dirname, '/category.html'));
    // }
    // else{ //will always want to check for userid cookie value after user has entered their SOL wallet addr
    //     console.log('=====NEW Logged-in Post Req=====')
    //     console.log('Current user: ' + req.cookies.userid);

    // }

    else if(req.cookies.category == undefined){
        res.sendFile(path.join(__dirname, '/category.html'));
    }
    else{

        console.log('User: ' + req.cookies.SOLaddr + ' attempting to send index.html');
        console.log(time.getTime() / 1000); // / by 1000 to get seconds
        res.sendFile(path.join(__dirname, '/index.html'));
    }

    // if(body[body.length-1] != undefined){ // will get selected value if post req has a selected value
    //     console.log('user: ' + req.cookies.userid + ' selected: ' + body[body.length-1].selected);

    //     //insert logic to determine correctness here
    //     //below is sample setting of correctness
    //     (async () => {
    //         console.log('DBACCESS:=> verify correctness of selected answer')
    //         var isCorrect = await checkUserAnswer(body[body.length-2].question, body[body.length-1].selected);
    //         console.log('iscorrect result'+isCorrect);
    //         body.push({'correctness': isCorrect}) //true denotes correct, false denotes incorrect

    //     })();
        
    //     //insert logic to determine bingo achieved here
    //     //below is sample setting of gameOver
    //     body.push({'gameOver': ' '}) //'X' denotes over, ' ' denotes bingo not achieved yet
    //     console.log('after game over');
    
    //     console.log(req.body);
    //     res.send(JSON.stringify(req.body));
    // }


    //res.send('post recieved');
  });


  app.post('/selection', function(req, res) {
    var body = req.body;
    console.log('user: ' + req.cookies.userid + ' selected: ' + body[body.length-1].selected);

        //insert logic to determine correctness here
        //below is sample setting of correctness
        (async () => {
            console.log('DBACCESS:=> verify correctness of selected answer')
            var isCorrect = await checkUserAnswer(body[body.length-2].question, body[body.length-1].selected);
            console.log('iscorrect result'+isCorrect);
            body.push({'correctness': isCorrect}) //true denotes correct, false denotes incorrect

            //insert logic to determine bingo achieved here
            //below is sample setting of gameOver
            
            body.push({'gameOver': isGameOver(req.body)}) //'X' denotes over, ' ' denotes bingo not achieved yet
            console.log('after game over');
        
            //console.log(req.body);
            res.send(JSON.stringify(req.body));
        })();
  });


  app.post('/getans', function(req, res){
    if(req.body.questionsAndAnswers == 'get'){
        (async () => {
            console.log('DBACCESS:=> requested question and answer data')
            var qAndAs = await getQuestionsAndAnswersFromDB(req.cookies.category);
            res.send(JSON.stringify(qAndAs));
        })();
    }
  });


/*
app.post('/submit-data', function (req, res) {
    var name = req.body.firstName + ' ' + req.body.lastName;
    
    res.send(name + ' Submitted Successfully!');
});
app.put('/update-data', function (req, res) {
    res.send('PUT Request');
});
app.delete('/delete-data', function (req, res) {
    res.send('DELETE Request');
});*/

var server = app.listen(5000, function () {
    console.log('Node server is running...');
});


//adds user address and playing date to users table
async function addUserToDB(addr, login_date) {
    pool.query("INSERT INTO users (wallet_address, login_date) VALUES (" + addr + ", " + '\'' + login_date + '\')');
}

//returns array of categories from database
async function getCategoriesFromDB() {
    var results = await pool.query("SELECT DISTINCT category from question");
    var cats = [];
    for(i = 0; i < results.rows.length; i++){
        cats.push(results.rows[i].category);
    }
    return cats;
}

//returns array of questions and answers from database
async function getQuestionsAndAnswersFromDB(cat) {
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
    for(i = 0; i < questions.length; i++){
        qAndAs.push(questions[i] + '`' + answers[i]); //using ` char as delimiter
    }
    return qAndAs;
}

async function checkUserAnswer(question, answer){
    question = queryFix(question);
    console.log("SELECT COUNT(*) FROM question where text = " + '\"' + question + '\"' + ' AND answer = ' + '\"' + answer + '\"');
    var results = await pool.query("SELECT COUNT(*) FROM question where text = " + '\'' + question + '\'' + ' AND answer = ' + '\'' + answer + '\'');
    if(results.rows[0].count > 0){ //means the selected answer is correct
        return true;
    }
    return false;
    //TODO -- add logic to return value to make decision based on
}


function setAddrAndStartTimeOnDB(addr, time){
    pool.query("INSERT ")
}

//=========================================
// game over check
//=========================================

function isGameOver(data){
    var rowCounter = 0;
    var columnCounter = 0;
    
    //row checker
    for(i = 0; i < data.length; i++){
        if(data[i].name != undefined){
            //checks for multiple correct answers in a row
            if(data[i].name == 'X'){
                rowCounter++
                console.log('rowCounter = ' + rowCounter)
                if (rowCounter == 5){
                    return 'X';
                }
            }
            else{
                rowCounter = 0;
            }

            //if next row, reset rowCount
            if(i > 0 && i % 4 == 0){
                rowCounter = 0;
            }
        }
        else{
            break; //checked whole board, jump out of loop when reached additional req info in body
        }
    }
    
    //column checker
    for(i = 0 ; i < 5; i++){
        for(j = 0; j < data.length; j++){
            if(data[i].name != undefined){
                if(data[j].name == 'X' && j % 4 == i){
                    columnCounter++
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
    console.log('columCounter = ' + columnCounter);
    console.log('rowCounter = ' + rowCounter);
    // if(columnCounter == 5 || rowCounter == 5){
    //     console.log('!!!!!!!!!!!WINNER!!!!!!!!!!!!!!!');
    //     return 'X'; //winner
    // }
    return ' '; //not a winner
}

//=========================================
// SQL input cleaning / reformatting
//=========================================

function cleanInput(string){
    //string = string.replaceAll('\'', '');
    //string = string.replaceAll('\"', '');
    string = string.replaceAll(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    return string;
}

function queryFix(string){
    return string.replaceAll('\'', '\'\'');
}

