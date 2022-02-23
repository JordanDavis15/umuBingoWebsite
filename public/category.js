
function getCategories(){

    fetch('/category', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({'selected': 'get-categories'})
        
    })
    .then(res => res.json())
    .then(data => createTable(data));
}

function createTable(data){
    console.log('creating category table');
    var btnArr = [];
    for(i = 0; i < data.length; i++){
        var tabRow = document.createElement('tr')
        tabRow.id = 'tr'+i;
        document.getElementById('categoryTable').appendChild(tabRow);

        btnArr[i]= document.createElement('td');
        btnArr[i].id = 'td' + i;
        btnArr[i].name = data[i]; //this is the value recieved in the post req
        btnArr[i].textContent = btnArr[i].name;
        
        btnArr[i].addEventListener('click', tableSelPost);
        
        document.getElementById('tr' + i).appendChild(btnArr[i]);
        document.getElementById('td' + i).className = 'tableData';
        document.getElementById('tr' + i).className = 'tableDataGroups';        
    }
}

function tableSelPost(){
    var tmpSel = {'selected': this.name};
    var buttonList = document.querySelectorAll('.tableData');   //buttonList is type NodeList
    var btnsArr = Array.prototype.slice.call(buttonList);       //converts NodeList into Array so values can be added to array
    btnsArr.push(tmpSel);
    console.log('Button data from screen: ' + buttonList.toString());
    fetch('/category', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(tmpSel)
        
    })
    .then(res => res.json())
    // .then(data => location.reload());
    .then(data => redir(data));
}

function redir(data){
    console.log('inside redirect fetch');
    if(data == 'good'){
        location.replace("/index");
    }
    else{
        location.replace("/login")
    }
}