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
            btnArr[i][j].name = btnArr[i][j].id+'TEXT'; //this is the value recieved in the post req
            btnArr[i][j].textContent = btnArr[i][j].name = btnArr[i][j].id+'TEXT';;
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