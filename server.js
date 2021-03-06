'use strict';
// to make the enviroment(.env) ready to read 
require('dotenv').config();
// 
const express = require('express');
// we use the superagent to make the API ready 
const superagent = require('superagent');
// cross origin resourses sharing 
const cors = require('cors');
// const PORT = process.env.PORT || 3000 ;
// to talk with the DB
const pg = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL)                
// call the express in our server
const server = express();
server.use(cors());
// initilizing request method instead of superagent 
var request = require("request");

const PORT = process.env.PORT || 3000;
const methodOverride = require('method-override');

// middleware 

server.use(express.urlencoded({ extended: true }));
server.set('view engine', 'ejs');
server.use('/public', express.static('public'));
server.use(methodOverride('_method'));




//about us 
server.get('/about' , (req , res ) => {
    res.render('pages/profile/aboutus')
})


//update machine name
server.put('/update/:mach_name' , updateMAchine);

function updateMAchine(req , res ){
    let {mname , catagory} = req.body ;
    let SQL = 'UPDATE machine SET machine=$1, catagory=$2 WHERE id=$3;' ;
    let values = [mname , catagory , req.params.mach_name];

    // console.log('helooo' , values);
    return client.query(SQL , values)
        .then(() => {
            return res.redirect('/machine_profile')

        })
}



//delete machine 
server.delete('/delete_mach/:mach_id' , deleteMachine) ;
function deleteMachine(req , res ){
    let SQL = 'DELETE FROM machine WHERE id=$1 ;' ;
    let values = [req.params.mach_id] ;

    // console.log( 'hiii' , values);
    return client.query(SQL , values)
        .then(() => {
           return res.redirect('/machine_profile');
        })
}



//machine profile
server.get('/machine_profile' , (req , res ) => {
    let sql = 'SELECT * FROM machine ;' ;
    return client.query(sql)
        .then((data) => {
            // console.log(data.rows)
            // console.log(data.rows);
            res.render('pages/profile/mymachines' , {table : data.rows});
        })
}) 


// profile page 
server.get('/profile' , (req , res ) => {
    let sql = 'SELECT * FROM food ;' ;
    return client.query(sql)
        .then((data) => {
            // console.log(data.rows);
            res.render('pages/profile/mystatus' , {table : data.rows});
        })
}) 



// delete the meal plan :)s
server.delete('/delete_prog/:meal_id' , deleteMeal) ;

function deleteMeal(req , res){
    // let requested = parseInt(req.params.meal_id) ;
    let SQL = 'DELETE FROM food WHERE id=$1 ;' ;
    let values = [req.params.meal_id] ;

    // console.log(values);    
     client.query(SQL , values)
    .then(() => {
        res.redirect('/profile');
    })
}

// add machine info to database
// server.post('/addMachine' , addToDataBase) ;
// function addToDataBase(req , res){
//     // console.log(req.body)
//     let {machine , catagory , url } = req.body ;
//     let SQL = 'INSERT INTO machine(machine , catagory , url) VALUES ( $1 , $2 , $3 ) ;' ;
//     let values = [machine , catagory , url] ;
//     console.log( "hello",SQL,values)
//     return client.query(SQL , values)
//         .then(() => {
//             // res.redirect('/machine_profile')

//         }) 
// }


// add the food to database
server.post('/status' , toDatabase) ;

function toDatabase( req , res ){
    // console.log(req.body)
    let { cal , prot , fat ,carb, array } = req.body
    let SQL = 'INSERT INTO food(cal , prot , fat ,carb , meals) VALUES ($1 , $2 , $3 ,$4 , $5);' ;
    let values = [cal , prot , fat , carb, array ];

    return client.query(SQL , values)
        .then(() => {
            res.redirect('/profile')
        })
}



// server.use( express.static('/public'));


server.get('/', (req, res) => {
    res.status(200).render('index')
});

server.get('/newMeal', (req, res) => {
    res.render('pages/searches/new')
})

// first route to get the mealplan #1
server.post('/mealLest', getMeals) ;

function getMeals(req, res) {

    // console.log(req.body)
    // let time = req.body.time ;
    let calories = req.body.calories;
    let dietType = req.body.dietType;
    let spicial = req.body.spicial;

    var options = {
        method: 'GET',
        url: 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/mealplans/generate',
        qs: {
            timeFrame: `day`,
            targetCalories: `${calories}`,
            diet: `${dietType}`,
            exclude: `${spicial}`
        },
        headers: {
            'x-rapidapi-host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
            'x-rapidapi-key': 'c3aaa42847msh4114d8320e35996p116efbjsnc1bea287f44f'
        }
    }

    request(options, function (error, response, body) {
        let data = JSON.parse(body);
        // console.log(data);
        res.render('pages/searches/show', { food: data })
        if (error) throw new Error(error);

    });
}

// second route to get machines

server.get('/newExc' , (req , res) => {
    res.render('pages/fitness/new')
})

server.post('/getExr' , getExcercise ) ;

function getExcercise(req , res ){
    let type = req.body.muscle ;
    const url = `https://wger.de/api/v2/exercise/search/?term=${type}`
    // console.log( 'helooooooo ',url);

    return superagent.get(url) 
        .then(data => {
            let newData = JSON.parse(data.text)
            // console.log('data super' ,newData.suggestions)
            res.render('pages/fitness/show' , {workout : newData.suggestions})
        })
}

// add machine info to database
server.post('/addMachine' , addToDataBase) ;
function addToDataBase(req , res){
    // console.log(req.body)
    let {machine , catagory , url } = req.body ;
    let SQL = 'INSERT INTO machine(machine , catagory , url) VALUES ( $1 , $2 , $3 ) ;' ;
    let values = [machine , catagory , url] ;
        // console.log( "hello",SQL,values)

    return client.query(SQL , values)
        .then(() => {
            res.redirect('/machine_profile')
        }) 
}



server.get('/addMachine:table_machine' , getmachineById)

// ///////////////////////////// 
function getmachineById(req , res) {
    let machine = req.params.machine_name;
    let SQL = `SELECT * FROM machine WHERE machine=$1 ;`;
    let values = [machine];
    return client.query(SQL , values)
    .then((data)=>{
      res.render('pages/profile/mystatus' , { machineChouse : data.rows[0]})
    })
}
/////////// update the machine ////////
server.put( '/update/:machine_name' , updateMachine);

function updateMachine(req , res) {
    let {machine} = req.body ;
    // console.log(machine)
    let SQL = `UPDATE machine SET machine=$1 WHERE machine=$2;`;
    let values = [machine ,req.params.machine_name];
    return client.query(SQL , values)
  .then(()=>{
     return res.redirect(`/mystatus/${req.params.machine_name}`);
  })
}

server.use('*', (req, res) => {
    res.status(404).send(' 404 ERROR !!!')
})
server.use((error, req, res) => {
    res.status(500).send(error)
})

client.on('error', error => {
    throw error;
})
client.connect()
    .then(() => {
        server.listen(PORT, () => console.log('server works in DB', PORT))
    })
    .catch(err => {
        throw `Error happened ${err}`;
    })