const express = require("express");
const { pool } = require("./dbconfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
require("dotenv").config();
const app = express();
const path = require("path");
const username ='satya';
const PORT = 3000;

const initializePassport = require("./passportConfig");

initializePassport(passport);

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname,'')));

app.use(
  session({
    // Key we want to keep secret which will encrypt all of our information
    secret: 'secret',
    // Should we resave our session variables if nothing has changes which we dont
    resave: false,
    // Save empty value if there is no vaue which we do not want to do
    saveUninitialized: false
  })
);
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("login");
});
app.use(express.static(path.join(__dirname,"")));


app.get("/addcar",checkNotAuthenticated, (req, res) => {
    res.render("adminaddcar.ejs");
  });

app.get("/home",checkNotAuthenticated, (req,res) =>{
  res.render("adminhead.ejs");
})
app.get("/center",checkNotAuthenticated, (req,res) =>{
  res.render("admincenter.ejs");
})
app.post("/something", async (req, res) => {
    let { number,model,year,center,price,imagelink,fuel_type } = req.body;
  
    let errors = [];
  
    console.log(
      req.body
    );
  
    
  
    
  
    
      
      //Validation passed
      pool.query(
        `SELECT * FROM cars
          WHERE number = $1`,
        [number],
        (err, results) => {
          if (err) {
            console.log(err);
          }
          console.log(results.rows);
  
          if (results.rows.length > 0) {
            return res.render("adminaddcar", {
              message: "car already registered"
            });
          } else {
            pool.query(
              `INSERT INTO cars (number, model, fuel,pph,year,centercity,imagelink)
                  VALUES ($1, $2, $3,$4,$5,$6,$7)
                  `,
              [number, model, fuel_type,price,year,center,imagelink],
              (err, results) => {
                if (err) {
                  throw err;
                }
                else {res.render("adminaddcar.ejs");}
                console.log(results.rows);
                
                
                
              }
            );
          }
        }
      );
    
  });
  app.post("/addcenter", async (req, res) => {
    let { center,link,code } = req.body;
  
    let errors = [];
  
    console.log(
      req.body
    );
  
    
  
    
  
    
      
      //Validation passed
      pool.query(
        `SELECT * FROM centers
          WHERE center = $1`,
        [center],
        (err, results) => {
          if (err) {
            console.log(err);
          }
          console.log(results.rows);
  
          if (results.rows.length > 0) {
            return res.render("admincenter", {
              message: "center already exists"
            });
          } else {
            pool.query(
              `INSERT INTO centers (center,image_link,pincode)
                  VALUES ($1, $2, $3)
                  `,
              [center,link,code],
              (err, results) => {
                if (err) {
                  throw err;
                }
                else {res.render("admincenter.ejs");}
                console.log(results.rows);
                
                
                
              }
            );
          }
        }
      );
    
  });


app.get("/login", (req, res) => {
  
  res.render("login.ejs");
});


app.get("/logout", (req, res) => {
  req.logout(function(err){
    if(err) {return next(err);}
    res.render("login", { message: "You have logged out successfully" });
  });
  
});

app.post("/signin", async (req, res) => {
  let { name, email, password, password2,image } = req.body;

  let errors = [];

  console.log({
    name,
    email,
    password,
    password2
  });

  if (!name || !email || !password || !password2||!image) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("signin", { errors, name, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM users
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("signin", {
            message: "Email already registered"
          });
        } else {
          pool.query(
            `INSERT INTO users (name, email, password,image)
                VALUES ($1, $2, $3,$4)
                RETURNING id, password`,
            [name, email, hashedPassword,image],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/login");
            }
          );
        }
      }
    );
  }
});


app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
    failureFlash: true
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/home");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
