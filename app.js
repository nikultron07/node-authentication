require('dotenv').config()
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const path = require('path');
const userModule = require('./models/user')
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test', {
   useNewUrlParser: true,
   useUnifiedTopology: true,
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
const jwt = require('jsonwebtoken');
const { error } = require('console');
app.use(cookieParser())
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(flash());

app.get('/', (req, res)=> {
    res.render('create',{
        redirectError: req.flash('redirectError'),
        name: "",
        email: "",
        password: ""
    })
})

app.get('/logout', (req, res) => {
    res.cookie("token", "")
    res.redirect('/')
})

app.get('/login', (req, res) => {
  res.render('login')
});


app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile', {user: req.datauser})
})

app.post('/login', async(req, res) => {
    let user = await userModule.findOne({email: req.body.email})
    if(!user){
        return res.render('login', {error: "User doesn't existing"})
    }
    bcrypt.compare(req.body.password, user.password, function(err, result) {
        let token = jwt.sign({email: user.email, name: user.name}, 'shhhhh');
        res.cookie("token", token)

       if(result) res.redirect('/profile');
       else res.render("login", {error: "Incorrect password" });
   });
});

app.post('/create', async (req, res) => {
    try{  
        let {name, email, password} = req.body;
        
        name = name?.trim();
        email = email?.trim();
        password = password?.trim();

        if(!name || !email || !password){
            return res.render('create', { redirectError: [], error: "Please fill in all details", name, email, password});
        }
        
        const datauser = await userModule.findOne({email: email})

        if(datauser){
           console.log("email already existing")
           return res.status(400).json({error: "email already existing"});
        }
        
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, async function(err, hash) {
  
                const user = await userModule.create({
                    name,
                    email,
                    password:hash
                })
                let token = jwt.sign({email: user.email, name: user.name}, 'shhhhh');
                res.cookie("token", token)
                res.redirect('/profile');
            });
        });
    }catch(err){
        console.error(err)
    }
})

function isLoggedIn(req, res, next){
    const token = req.cookies.token;
    
   if (!token) {
  req.flash('redirectError', 'Please login first!');
  req.session.save(() => {
    return res.redirect('/');
  });
}

    else{
        let data = jwt.verify(req.cookies.token, 'shhhhh')
        req.datauser = data;
        next()
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on http://10.68.97.51:3000');
});

