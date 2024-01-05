//167378313952-md9ph7ssp5hikfqe275pcmaqvr0v1b4v.apps.googleusercontent.com
//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

require('./ath');
const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
dotenv.config({ path: './.env' });
const ejs = require("ejs");
const bodyParser = require('body-parser');
const passport = require('passport');

const app = express();

app.set("view engine" , 'ejs');
app.use(express.static("static"))
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "vanta" }));
app.use(passport.initialize());
app.use(passport.session());

function isLoggedIn(req, res, next) {
    req.user ? next() : res.sendStatus(401);
}

app.get("/", (req ,res) =>{
    return res.render("loginPage");
    res.send('<a href="/auth/google">Authenticate with Google</a>');
     // return res.render("oauth");
});

app.get("/protected", isLoggedIn, async (req, res) => {
    return res.render("indexy", { profImg: req.user.profileImage });
    // res.send(`Hello ${req.user.displayName}! <img src="${req.user.profileImage}" alt="Profile Image">`);
});

app.get("/login", (req ,res) =>{
    return res.render("loginPage");
    // res.send('<a href="/auth/google">Authenticate with Google</a>');
     // return res.render("oauth");
});

app.get("/auth/google", 
    passport.authenticate('google', {scope: ['email', 'profile']})
    // return res.render("oauth");
);

app.get("/google/callback",
    passport.authenticate('google', {
        successRedirect: '/protected',
        failureRedirect: '/auth/failure',
    })
)

app.get("/auth/failure", (req, res) => {
    res.send("Something went wrong!");
});

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        }
        req.session.destroy();
        res.redirect('/');
    });
});

app.listen(2000 , ()=>{
    console.log("Server running at http://localhost:2000");
});