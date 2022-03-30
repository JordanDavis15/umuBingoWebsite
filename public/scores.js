function returnToLogin(){
    location.replace("/login");
}

function getScores(){

    fetch('/scores', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}, 
        //body: JSON.stringify({'': ''})
        
    })
    .then(res => res.json())
    .then(data => createTable(data));
}

function createTable(data){
    console.log('creating scores table');
    var btnArr = [];
    for(i = 0; i < data.length; i++){
        var tabRow = document.createElement('tr')
        tabRow.id = 'tr'+i;
        document.getElementById('scoresTable').appendChild(tabRow);

        btnArr[i]= document.createElement('td');
        btnArr[i].id = 'td' + i;
        btnArr[i].name = i+1 + '. Wallet: ' + data[i]; //this is the value recieved in the post req
        btnArr[i].textContent = btnArr[i].name;
        
        //btnArr[i].addEventListener('click', tableSelPost);
        
        document.getElementById('tr' + i).appendChild(btnArr[i]);
        document.getElementById('td' + i).className = 'tableData';
        document.getElementById('tr' + i).className = 'tableDataGroups';        
    }
}