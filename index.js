let authToken = getCookie('authToken');

if(authToken){
    console.log("token found - redirect to game");
}else{
    console.log("no token found");
    setRegistrationForm('./registration_form').
    then(next=> {
        setLoginForm("./login_form");
    });
}
//load auth forms


function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return false;
}

async function loginUser(){
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch("./login",
        {
            method: "POST",
            body: JSON
                .stringify
                ({
                    username: username,
                    password: password,
                }),
            headers: {
                "Content-type": "application/json",
            },
        });

    let res =await response.text();
    res = JSON.parse(res);
    if(res.http === 200 && res.instruction === "login-success"){
        setCookie("authToken", res.authToken, 1);
        document.getElementById("serverResponses").innerHTML = "Login Success: redirecting to game client in 3 seconds.";
        setTimeout(function(){
            window.location.href = "./";
        }, 3000);

    }else{
        document.getElementById("serverResponses").innerHTML = "Login failed..";
    }
}

async function setRegistrationForm(url) {
    const response = await fetch(url);
    document.getElementById("authFront").innerHTML = await response.text();
}

async function setLoginForm(url) {
    const response = await fetch(url);
    const cache = document.getElementById("authFront").innerHTML;
    document.getElementById("authFront").innerHTML = cache + await response.text();
}

async function register() {
    const username = document.getElementById("registrationUsername").value;
    const password = document.getElementById("registrationPassword").value;
    const passwordRepeat = document.getElementById("registrationPasswordRepeat").value;

    if(password !== passwordRepeat){
        alert("Passwords do not match.");
    }else if(5>password.length){
        alert("Your password is too short.")
    }else{
        const headers = new Headers();
        headers.append("Content-Type", "application/json");

        const response = await fetch("/register", {
            method: "POST",
            body: JSON.stringify(
                {
                    username: username,
                    password: password,
                    passwordRepeat: passwordRepeat,
                }),
            headers: headers,
        });
        alert(await response.text());
    }
}