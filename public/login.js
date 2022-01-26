const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");


loginButton.addEventListener("click", (e) => {
    e.preventDefault();
    const SOLaddr = loginForm.SOLaddr.value;

    console.log('Login made by:' + SOLaddr);
})