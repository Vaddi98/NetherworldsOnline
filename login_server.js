require('dotenv').config()
var jwt = require('jsonwebtoken');
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const bcrypt = require('bcrypt');
let fs = require('fs');


const app = express();
app.use(express.json());
const server = createServer(app);
// -------------------------------------------------------------------------------------------------------------
//Loader for users.
//Creates an array cache with user info to quickly compare to.
//TODO: This cache is currently not being used but could be integrated into the login and registration.
// -------------------------------------------------------------------------------------------------------------
console.log("Start-up: Loading users into memory.");
let users = [];
fs.readdir('data/users', (err, files) => {
    for (let file of files) {
        fs.readFile('data/users/'+file, 'utf8', (err, data) => {
            users.push(data);
            if (err) {
                console.log(err);
            }
        })
    }
})
console.log("Start-up: users loaded to memory");
// -------------------------------------------------------------------------------------------------------------
//ROUTER
// -------------------------------------------------------------------------------------------------------------
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, './src/index.html'));
});
// -------------------------------------------------------------------------------------------------------------
//Registration
// -------------------------------------------------------------------------------------------------------------
app.post("/register", (req, res) => {

    fs.readFile("data/users/"+req.body.username+".json", "utf8", (err, data) => {

        if(data){
            res.send(JSON.stringify({http:400, instruction: 'username-taken'}));
        }

        if(err){

            fs.readFile('data/userTemplate.json', 'utf8', (err, userTemplate) => {
                let user = JSON.parse(userTemplate);
                user.username = req.body.username;
                user.password = req.body.password;
                let saltRounds = parseInt(process.env.SALTROUNDS);
                bcrypt.hash(user.password, saltRounds, function(err, hash) {
                    if(err){
                        console.log(err);
                    } else {
                        user.password = hash;
                        fs.writeFile("data/users/"+user.username+".json", JSON.stringify(user),(err) => {
                            if(err){
                                console.log(err);
                                res.send(JSON.stringify({http:400, instruction: 'registration-failed'}));
                            }else{
                                users.push(user);
                                res.send(JSON.stringify({http:200, instruction: 'registration-success'}));
                                console.log("new user created: "+ user.username);
                            }
                        })
                    }
                });
            })
        }
    })
})

app.get('/registration_form', (req, res) => {
    res.sendFile(join(__dirname, './src/registration_form.html'));
})

//Log in
// -------------------------------------------------------------------------------------------------------------
app.post("/login", (req, res) => {
    fs.readFile("data/users/"+req.body.username+".json", "utf8", (err, data) => {
        if(!err && data){
            const user = JSON.parse(data);
            loginHandler(req.body.username, req.body.password, user.password, res);
        }else{
            if(err){
                res.send(JSON.stringify({http:400, instruction: 'login-failed'}));

            }else{
                res.send(JSON.stringify({http:500, instruction: 'login-failed'}));
            }
        }
    })

})

app.get('/login_form', (req, res) => {
    res.sendFile(join(__dirname, './src/login_form.html'));
})

app.post('/auth/token/verify', (req, res) => {
    const token = req.body.token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let timestamp = Date.now();

    timestamp = timestamp.toString();
    timestamp = timestamp.substring(0, timestamp.length - 3);
    timestamp = parseInt(timestamp);

        if(decoded.iat <= timestamp && decoded.exp >= timestamp){
            res.send({http: 200, instruction:"valid-token"});
        }else{
            res.send({http: 200, instruction:"bad-token"})
        }
})

app.get('/game', (req, res) => {
    const token = req.body.token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
})

// -------------------------------------------------------------------------------------------------------------
//scripts
//endpoints for scripts required to run html/javascript modules.
// -------------------------------------------------------------------------------------------------------------
app.get('/index.js', (req, res) => {
    res.sendFile(join(__dirname, './index.js'));
})
// -------------------------------------------------------------------------------------------------------------
// console commands API
// -------------------------------------------------------------------------------------------------------------
app.get("/show-users", (req, res) => {
    console.log('show-users:');
    console.log(users);
})

app.get('/count-users', (req, res) => {
    let i = 0
    for (let user of users) {
        i++;
    }
    console.log("Number of registered users: "+i);
})
// -------------------------------------------------------------------------------------------------------------

server.listen(process.env.PORT, () => {
    console.log('server running at http://localhost:'+ process.env.PORT);
});

//Functions
// -------------------------------------------------------------------------------------------------------------
async function loginHandler(username, password, hash, res){
    const result = await bcrypt.compareSync(password,hash)
    if (result){
        console.log('user logged in: '+username);

        //token generation
        var privateKey = process.env.JWT_SECRET_KEY;
        let payload =
        {
            'username': username,
            'exp': Math.floor(Date.now() / 1000) + (60 * 60 * 24),
            'iss': process.env.SERVER_NAME
        };
        const token = jwt.sign(payload, privateKey);
        //send token
        res.send({http: 200, instruction:"login-success", authToken: token});
    }else{
        console.log('log in failed: '+username);
        res.send({http: 400, instruction:"login-failed"});
    }
}