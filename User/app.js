const express = require("express");
const dotenv = require("dotenv");
const ejs = require("ejs");
const bodyParser = require('body-parser');
const { Client } = require("pg");
const session = require("express-session");
const QRCode = require('qrcode');
const passport = require('passport');

dotenv.config({ path: './.env' });

const app = express();

app.set("view engine", 'ejs');
app.use(express.static("static"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "vanta",
    resave: false,
    saveUninitialized: false
  }));
app.use(passport.initialize());
app.use(passport.session());

require('./ath');

let reviews={};
let searchParams={};
let kharcha = 0;
let cay = 0;
let qrCodePath='';
let amt = 0;

function isLoggedIn(req, res, next) {
    try {
        if (req.isAuthenticated()) {
            next();
        } else {
            res.redirect('/auth/google');
        }
    } catch (error) {
        console.log(error);
    }
}

const calcHours = async (searchParams) => {
    var ghante=0;
    ghante += parseInt(searchParams.endTime.slice(0,2))-parseInt(searchParams.startTime.slice(0,2));
    const eD = searchParams.endDate.toString();
    const sD = searchParams.startDate.toString();

    if(eD.slice(5,7)==sD.slice(5,7)){
        console.log("CASE-A");
        ghante+=(eD.slice(8, 11)-sD.slice(8,11))*24;
    }
    else if(sD.slice(5,7)==2){
        console.log("CASE-B");
        if(sD.slice(0,4)%4==0){
            ghante+=(29-sD.slice(8,11) + eD.slice(8,11))*24;
        }
        else{
            ghante+=(28-sD.slice(8,11) + eD.slice(8,11))*24;
        }       
    }
    else if(sD.slice(5,7) in [1, 3, 5, 7, 8, 10, 12]){
        console.log("CASE-C");
        ghante+=(31-sD.slice(8,11) + eD.slice(8,11))*24;
    }
    else{
        console.log("CASE-D");
        ghante+=(30-sD.slice(8,11) + eD.slice(8,11))*24;
    }

    if(ghante>72||ghante<1){
        return 0;
    }

    kharcha = ghante;

    console.log(ghante);

    return ghante;
}

const getReviews = async () => {
    try {
        const client = new Client({
            // user: process.env.PGUSER,
            // host: process.env.PGHOST,
            // database: process.env.PGDATABASE,
            // password: process.env.PGPASSWORD,
            // port: process.env.PGPORT
            user: "postgres",
            host: "localhost",
            database: "car_rental",
            password: "password",
            port: 5432
        })
 
        await client.connect()
        const res = await client.query('SELECT * FROM reviews ORDER BY id DESC LIMIT 6')
        // console.log(res.rows)
        await client.end()
        return res.rows;
    } catch (error) {
        console.log(error)
    }
}

const getCars = async (searchParams) => {
    try {
        const client = new Client({
            user: "postgres",
            host: "localhost",
            database: "car_rental",
            password: "password",
            port: 5432
        });

        await client.connect();

        let whereClause = '1 = 1'; 
        console.log(searchParams.from);
        if (searchParams.from) {
            whereClause += ` AND centrecity = '${searchParams.from}'`;
        }
        if (searchParams.model && searchParams.model !== 'Any') {
            whereClause += ` AND model = '${searchParams.model}'`;
        }

        whereClause += ` AND bookedtill IS NULL`;
        
        // if (searchParams.startDate && searchParams.startTime) {
        //     const tym = searchParams.startDate.toString() + " " + searchParams.startTime.toString()+":00";
        //     whereClause += ` AND '${tym}'>'${searchParams.bookedtill}'`;
        // }

        const queryString = `SELECT * FROM cars WHERE ${whereClause}`;
        const res = await client.query(queryString);

        await client.end();
        return res.rows;
    } catch (error) {
        console.log(error);
    }
};

const getCarDetailsById = async (carNum) => {
    try {
        const client = new Client({
            user: "postgres",
            host: "localhost",
            database: "car_rental",
            password: "password",
            port: 5432
        });

        await client.connect();

        const queryString = 'SELECT * FROM cars WHERE num = $1';
        const res = await client.query(queryString, [carNum]);

        await client.end();

        return res.rows[0];
    } catch (error) {
        console.log(error);
    }
};

const getLocations = async () => {
    try {
        const client = new Client({
            user: "postgres",
            host: "localhost",
            database: "car_rental",
            password: "password",
            port: 5432
        });

        await client.connect();

        const queryString = `SELECT * FROM citiescentres`;
        const res = await client.query(queryString);

        return res.rows;
    }
    catch (error){
        console.log(error);
    }
};

const Yuz = async (req) => {
    try {
        const email = req.user ? req.user.email : null;
        const username = req.user ? req.user.displayName : null;

        const client = new Client({
            user: "postgres",
            host: "localhost",
            database: "car_rental",
            password: "password",
            port: 5432
        });

        await client.connect();

        const queryString = `INSERT INTO users(username, email) VALUES ($1, $2)`;
        try {
            const res = await client.query(queryString, [username, email]);
        } catch (error2) {
            console.log(error2);
        }
    } catch (error) {
        console.log(error);
    }
}

app.get("/" ,async (req ,res) =>{
    reviews = await getReviews();
    locations = await getLocations();
    const profImage = req.user ? req.user.profileImage : null;
    return res.render("index", { reviews: reviews, cars: null, msg: "Search a Car!", locations: locations, profImg: profImage });
});

app.post("/", async (req, res) =>{
    searchParams = {
        from: req.body.from,
        to: req.body.to,
        model: req.body.model,
        startDate: req.body.startDate,
        startTime: req.body.startTime,
        endDate: req.body.endDate,
        endTime: req.body.endTime,
    };

    const profImage = req.user ? req.user.profileImage : null;

    try {
        const cars = await getCars(searchParams);
        const hours = await calcHours(searchParams);
        reviews = await getReviews();
        locations = await getLocations();

        if(cars && cars.length>0){
            if(hours){
                return res.render("index", { reviews: reviews, cars: cars, gt: req.body.startDate - req.body.endDate, msg: null, locations: locations, hours: hours, profImg: profImage });
            }
            return res.render("index", { reviews: reviews, cars: cars, gt: req.body.startDate - req.body.endDate, msg: "Please Enter a Valid Time Frame!", locations: locations, hours: hours, profImg: profImage });
        };
        return res.render("index", { reviews: reviews, cars: cars, gt: req.body.startDate - req.body.endDate, msg: "No Car Found!", locations: locations, profImg: profImage });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
});

app.get("/google/callback",
    passport.authenticate('google', {
        successRedirect: '/',
        failureRedirect: '/auth/failure',
    })
);

app.get("/auth/failure", (req, res) => {
    res.send("Something went wrong!");
});

app.get("/auth/google", 
    passport.authenticate('google', {scope: ['email', 'profile']})
    // return res.render("oauth");
);

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

app.get("/payment", isLoggedIn, async (req, res) => {
    try {
        Yuz(req);

        const carNum = req.query.carNum;
        cay = carNum;
        const carDetails = await getCarDetailsById(carNum);
        amt = kharcha * carDetails.pph - 1;
        const profImage = req.user ? req.user.profileImage : null;

        console.log(req.query);

        return res.render("payment", { car: carDetails, profImg: profImage, searchParams: searchParams, gh: kharcha });
    } catch (error) {
        console.log(error);
        return res.status(500).send("Internal Server Error");
    }
});

app.post('/payment', isLoggedIn, async (req, res) => {
    try {
        const currentTime = new Date();

        const client = new Client({
            user: "postgres",
            host: "localhost",
            database: "car_rental",
            password: "password",
            port: 5432
        });

        await client.connect();

        var id = await client.query('SELECT userid FROM users where email =$1', [req.user.email]);
        id = id.rows.length > 0 ? id.rows[0].userid : null;

        const queryString = `
            INSERT INTO payments (userid, amount, timeofpayment, num, start_date, end_date, centre_from, centre_to)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        const values = [id, amt, currentTime, cay, searchParams.startDate, searchParams.endDate, searchParams.from, searchParams.to];

        await client.query(queryString, values);

        const result = await client.query('SELECT paymentsid FROM payments WHERE userid = $1 ORDER BY paymentsid DESC LIMIT 1', [id]);
        const pid = result.rows.length > 0 ? result.rows[0].paymentsid : null;

        await client.end();

        console.log("Payment Successful!");

        if (pid === null) {
            throw new Error("Failed to retrieve payment ID.");
        }

        const paymentDetails = {
            id: pid,
            amount: amt,
            carNumber: cay,
            startDate: searchParams.startDate,
            endDate: searchParams.endDate,
            from: searchParams.from,
            to: searchParams.to,
        };

        const qrCodeData = JSON.stringify(paymentDetails);
        const email = req.user ? req.user.email : null;
        qrCodePath = 'static/QR' + email + '.png';

        await QRCode.toFile(qrCodePath, qrCodeData);

        qrCodePath = 'QR' + email + '.png';

        res.redirect("/booked");
    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/booked", isLoggedIn, async (req, res) => {
    const profImage = req.user ? req.user.profileImage : null;
    return res.render("booked", {profImg: profImage, qrCodePath: qrCodePath});
});

app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const client = new Client({
            user: "postgres",
            host: "localhost",
            database: "car_rental",
            password: "password",
            port: 5432
        });

        await client.connect();

        var resx = await client.query('SELECT userid FROM users where email =$1',[req.user.email]);
        const userid = resx.rows[0].userid;
        var car = await client.query('SELECT num FROM payments where userid =$1',[userid]);

        car = car.rows;

        console.log(car);

        if (car.length > 0) {
            var arr=[];
            // const carNumbers = car.map(item => item.num);
            for(let i=0; i<car.length; i++){
                arr.push(car[i]["num"]);
            }

            var dhaaga = "";

            // for(let i=0; )

            console.log(arr);
            var gaadi = await client.query('SELECT num, imagelink, model FROM cars WHERE num IN ($1)', [arr]);
            gaadi = gaadi.rows;

            console.log(gaadi);

            const profImage = req.user ? req.user.profileImage : null;
            res.render('user', { book: gaadi, user: req.user.email, car: gaadi, n: 0, profImg: profImage });
        } else {
            const profImage = req.user ? req.user.profileImage : null;
            res.render('user', { book: [], user: req.user.email, car: [], n: 0, profImg: profImage });
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/rev', async(req, res) => {
    rev = [
        req.body.username,
        req.body.title,
        req.body.rating,
        req.body.review,
    ];

    try {
        const client = new Client({
            user: "postgres",
            host: "localhost",
            database: "car_rental",
            password: "password",
            port: 5432
        });

        await client.connect();

        const queryString = `
            INSERT INTO reviews (username, title, starratings, content)
            VALUES ($1, $2, $3, $4)
        `;

        const values = rev;

        await client.query(queryString, values);

    }
    catch (error) {
        console.error('Error fetching bookings:', error);
        res.redirect('/');
    }

    res.redirect('/');
});

app.listen(2000 , ()=>{
    console.log("Server running at http://localhost:2000");
});