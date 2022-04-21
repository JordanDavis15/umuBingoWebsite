/*-------------------------------------------------------------------
|  File: funcs.js
|
|  Purpose:  This file contains the code that is used in processing
|            actions by the user on the board and is responsible for 
|            board updates. 
| 
|
|  Author: Jordan Davis (4/27/2022)
|
|
|  Change Log:
|
*-------------------------------------------------------------------*/

var questionIndex = 0;
var qAndAs = null;

function myFunction(){   
    //document.write('Welcome to the UMU bingo game:' + id); 
    console.log('button clicked');
    console.log(this.id);
    document.getElementById(this.id).innerHTML = 'Clicked';
}  

function createTable(qAndAs){
    console.log('creating board table');
    var currIndex = 0;
    var btnArr = [];
    this.qAndAs = qAndAs;
    console.log(qAndAs[0]);
    for(i = 0; i < qAndAs.length; i++){
        qAndAs[i] = qAndAs[i].split('`');
    }
    for(i = 0; i < 5; i++){
        btnArr[i] = new Array();
        var tabRow = document.createElement('tr')
        tabRow.id = 'tr'+i;
        document.getElementById('boardTable').appendChild(tabRow);
        for(j = 0; j < 5; j++){
            btnArr[i][j]= document.createElement('td');
            btnArr[i][j].id = 'td' + currIndex;
            //btnArr[i][j].name = btnArr[i][j].id; //this is the value recieved in the post req
            //btnArr[i][j].textContent = "any answer" + i + j;
            btnArr[i][j].name = qAndAs[currIndex][1];
            btnArr[i][j].textContent = qAndAs[currIndex][1];
            
            btnArr[i][j].addEventListener('click', tableSelPost);
            // btnArr[i][j].addEventListener('click', myfunction(btnArr[i][j].id))
            //console.log(btnArr[i][j].onclick)
            
            document.getElementById('tr' + i).appendChild(btnArr[i][j]);
            document.getElementById('td' + currIndex).className = 'tableData';
            document.getElementById('tr' + i).className = 'tableDataGroups';
            currIndex++;
        }
    }
    document.getElementById('questionbox').textContent = qAndAs[0][questionIndex];
    incrementQuestionIndex();
    setRowHeight();
}

function setRowHeight(){
    var tbl=document.getElementById('boardTable'), biggestRow=0, rowHeight=0, row=0;
    for (row=0; row < tbl.rows.length; row++) {     //find biggest row height
        rowHeight=parseInt(tbl.rows[row].offsetHeight);
        if (rowHeight > biggestRow) {biggestRow=rowHeight;}
    }
    for (row=0; row < tbl.rows.length; row++) {     //set all rows to biggest row height
        tbl.rows[row].style.height=biggestRow + "px";
    }
}


function getQuestionsAndAnswers(){
    fetch('/getans', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({'questionsAndAnswers':'get'})
        
    })/*.then(res => {
        console.log('Request complete! response:', res);
        console.log("=====");
        console.log(res.body.toString());
      });*/
    .then(res => res.json())
    .then(data => createTable(data));
}

function tableSelPost(){
    var currQuestion = {'question': document.getElementById('questionbox').innerHTML};
    var tmpSel = {'selected': this.name};
    var buttonList = document.querySelectorAll('.tableData');   //buttonList is type NodeList
    var btnsArr = Array.prototype.slice.call(buttonList);       //converts NodeList into Array so values can be added to array
    btnsArr.push(currQuestion);
    btnsArr.push(tmpSel);
    console.log('Button data from screen: ' + buttonList.toString());
    fetch('/selection', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(btnsArr)
        
    })/*.then(res => {
        console.log('Request complete! response:', res);
        console.log("=====");
        console.log(res.body.toString());
      });*/
    .then(res => res.json())
    .then(data => boardProcessing(data));
}

function boardProcessing(boardRes){
    console.log('Data recieved from server = ');
    console.log(boardRes[boardRes.length - 3].selected); //gets last selected answer
    console.log(boardRes[boardRes.length - 2].correctness); //gets correctness of answer
    console.log(boardRes[boardRes.length - 1].gameOver); //gets game over value from server

    //if gameover notify user
    if(boardRes[boardRes.length - 1].gameOver == 'X'){
        gameOver(boardRes);
    }
    else{
        //if incorrect do not mark a space
        if(boardRes[boardRes.length - 2].correctness != true){
            //insert logic to notify user that answer was incorrect
            console.log('incorrect');
        }
        else{
            console.log('correct answer, updating table...');
            updateDisplayBoard(boardRes);
        }
    }
}

//this is only called if selected answer is correct
function updateDisplayBoard(boardInfo){
    var currentTdToProcess = null;
    var selected = boardInfo[boardInfo.length-3].selected;
    var previousAnswers = Array();
    var newBoard = Array();

    //remove all table date
    for(i = 0; i < 25; i++){
        currentTdToProcess = boardInfo[i];
        console.log(currentTdToProcess);
        console.log(currentTdToProcess.name);
        previousAnswers.push(document.getElementById('td' + i).textContent);
        //currentTdToProcess.parentNode.removeChild(currentTdToProcess);
        document.getElementById('td' + i).outerHTML = "";
        console.log('removed all table data since selection was correct');
    }

    //repopulate table data into newBoard Array
    for(i = 0; i < 25; i++){
        //create new td and set same attributes as before post res was recieved, except for changing correct answer td to be different
        currentTdToProcess = document.createElement('td');
        currentTdToProcess.id = 'td' + i;
        currentTdToProcess.name = previousAnswers[i];
           
        currentTdToProcess.addEventListener('click', tableSelPost);
        console.log(currentTdToProcess.textContent);
        console.log(currentTdToProcess.textContent + '|||||||' + selected);
        if(currentTdToProcess.name == selected){
            currentTdToProcess.name = 'X';  //this is the value recieved in the post req
            currentTdToProcess.textContent = 'X'; //mark selected as correct 
            newBoard.push(currentTdToProcess);
        }
        else{
            currentTdToProcess.name = previousAnswers[i];  //this is the value recieved in the post req 
            currentTdToProcess.textContent = previousAnswers[i];
            newBoard.push(currentTdToProcess);
        }
    }

    //add new table board to screen
    var currIndex = 0;
    for(i = 0; i < 5; i++){
        for(j = 0; j < 5; j++){
            console.log(newBoard[currIndex]);
            document.getElementById('tr' + i).appendChild(newBoard[currIndex]);
            document.getElementById('td' + currIndex).className = 'tableData';
            currIndex++;
        }
    }
    console.log(this.questionIndex);
    document.getElementById('questionbox').textContent = qAndAs[this.questionIndex][0];
    incrementQuestionIndex();
    console.log('board has been updated!');
}

function newQuestion(){
    document.getElementById('questionbox').textContent = qAndAs[this.questionIndex][0];
    incrementQuestionIndex();
}

function incrementQuestionIndex(){
    console.log("length of questionIndex" + this.questionIndex);
    if(this.questionIndex + 1 < this.qAndAs.length){
        this.questionIndex ++;
    }
    else{
        this.questionIndex = 0;
    }
}

function gameOver(data){
    document.getElementById('header').textContent = 'BINGO!! Game Over!';
    location.replace("/scores");
}


// function catSelection(){
//     var tmpSel = {'category': document.getElementById('cats').value};
//     fetch('/category', {
//         method: 'POST',
//         headers: {'Content-Type': 'application/json'}, 
//         body: JSON.stringify(tmpSel)
        
//     })
//     .then(res => res.json())
//     .then(data => hideSelectionInfo(data));
// }

// function hideSelectionInfo(data){
//     console.log('attempting to hide selection info');
//     console.log(data);
//     if(data.hideSelection == 'X'){
//         document.getElementById('selLabel').outerHTML = "";
//         document.getElementById('cats').outerHTML = "";
//         document.getElementById('selButton').outerHTML = "";
//     }
// }