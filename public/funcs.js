function myFunction(){   
    //document.write("Welcome to the UMU bingo game:" + id); 
    console.log("button clicked");
    console.log(this.id);
    document.getElementById(this.id).innerHTML = "Clicked";
}  

var btnArr = [];
function createBoardButtons(){
    console.log("creating board buttons");
    for(i = 0; i < 5; i++){
        btnArr[i] = new Array();
        for(j = 0; j < 5; j++){
            btnArr[i][j]= document.createElement("button");
            btnArr[i][j].id = 'b' + i + j;
            btnArr[i][j].name = btnArr[i][j].id+'TEST'; //this is the value recieved in the post req
            btnArr[i][j].textContent = btnArr[i][j].name = btnArr[i][j].id+'TEXTtest';;
            btnArr[i][j].addEventListener("click", myFunction);
           // btnArr[i][j].addEventListener("click", myfunction(btnArr[i][j].id))
            //console.log(btnArr[i][j].onclick)
        }
    }

    for(i = 0; i < btnArr.length; i++){
        for(j = 0; j < btnArr[i].length; j++){
            document.getElementById('d' + i).className = "btn-group-board"
            document.getElementById('d' + i).appendChild(btnArr[i][j]);
        }
    }
}

function createTable(){
    console.log("creating board table");
    for(i = 0; i < 5; i++){
        btnArr[i] = new Array();
        var tabRow = document.createElement("tr")
        tabRow.id = 'tr'+i;
        document.getElementById("boardTable").appendChild(tabRow);
        for(j = 0; j < 5; j++){
            btnArr[i][j]= document.createElement("td");
            btnArr[i][j].id = 'td' + i + j;
            btnArr[i][j].name = btnArr[i][j].id+'TEST'; //this is the value recieved in the post req
            btnArr[i][j].textContent = btnArr[i][j].name = btnArr[i][j].id+'TEXTtest';;
            
            btnArr[i][j].addEventListener("click", testPost);
           // btnArr[i][j].addEventListener("click", myfunction(btnArr[i][j].id))
            //console.log(btnArr[i][j].onclick)
            
            document.getElementById("tr" + i).appendChild(btnArr[i][j]);
            document.getElementById("td" + i + j).className = "tableData";
            document.getElementById("tr" + i).className = "tableDataGroups";
            
        }
        
    }
}

function testPost(){
    this.name='X';
    this.innerHTML='X';
    var buttonList = document.querySelectorAll(".tableData");
    console.log(buttonList);
    fetch("/", {
        method: "POST",
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(buttonList)
      }).then(res => {
        console.log("Request complete! response:", res);
      });
}