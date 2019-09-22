/*  WHAT WE WANT TO HAVE FOR THE SERVER

/ --> res = this is working

/signin  --> POST = success/fail

/register  --> POST = user

/profile/:userId --> GET = user

/high-score --> PUT --> user high score

*/

//IMPORT INSTALLS
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

//CONNECT DATABASE
const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'isaac',
    password : '12345',
    database : 'tetris'
  }
});

db.select('*').from('users').then(data => {
  console.log(data);
});

const app = express();

app.use(bodyParser.json());

app.use(cors());

//DATABASE
// const database = {
//   users: [
//     {
//       id: '123',
//       name: 'Isaac',
//       password: 'cookies',
//       email: 'isaac@hotmail.com',
//       entries: 0,
//       joined: new Date()
//     },
//
//     {
//       id: '124',
//       name: 'Sally',
//       password: 'bananas',
//       email: 'sally@hotmail.com',
//       entries: 0,
//       joined: new Date()
//     }
//   ]
//
//   // login: [
//   //   {
//   //     id: '987',
//   //     hash: '',
//   //     email: 'isaac@hotmail.com'
//   //   }
//   // ]
// }

// Root Route
app.get('/', (req, res)=> {
  res.send(database.users);
})


//signin
app.post('/signin', (req, res) => {

  db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
      // console.log(isValid);
      if(isValid){
       return db.select('*').from('users')
        .where('email', '=', req.body.email)
        .then(user => {
          res.json(user[0])
        })
         .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json("wrong credentials")
      }
    })
     .catch(err => res.status(400).json('wrong credentials'))


  // if(req.body.email === database.users[0].email &&
  //    req.body.password === database.users[0].password) {
  //      // res.json('success');
  //      res.json(database.users[0]);
  //    } else {
  //      res.status(400).json('error logging in');
  //    }
})


//register
app.post('/register', (req, res) => {
  const { email, name, password } = req.body;

  //Security in server
  if(!email || !name || !password){
    return res.status(400).json('incorrect form submission');
  }

  //Bcrypt Hash
  const hash = bcrypt.hashSync(password);

  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email

    })
     .into('login')
     .returning('email')
     .then(loginEmail => {
       return  trx('users')
       .returning('*')
       .insert({
         email: loginEmail[0],
         name: name,
         joined: new Date()
       })
        .then(user => {
          res.json(user[0]);
        })
     })
     .then(trx.commit)
     .catch(trx.rollback)
  })


   .catch(err => res.status(400).json('unable to register'));
  // database.users.push({
  //   id: '125',
  //   name: name,
  //   email: email,
  //   entries: 0,
  //   joined: new Date()
  // })
  //res.json(database.users[database.users.length -1]);
})


//profile
app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  // let found = false;
  db.select('*').from('users').where({id})
  .then(user => {
    if(user.length){
      res.json(user[0]);
    } else{
      res.status(400).json('Not found')
    }
  })
   .catch(err => res.status(400).json('Error getting user'))
  // database.users.forEach(user => {
  //   if(user.id === id){
  //     found = true;
  //     return res.json(user);
  //   }
  // })
  // if(!found){
  //   res.status(400).json('not found');
  // }
})


//Entrie High score
app.put('/high-score', (req, res) => {
  const { id, entries } = req.body;

   db('users')
  .where('id', '=', id)
  .returning('*')
  .update({
    entries: entries
  })
  .then(user => {
    res.json(user[0]);
  })
  .catch(err => res.status(400).json('unable to get entries'))

  // let found = false;
  // database.users.forEach(user => {
  //   if(user.id === id){
  //     found = true;
  //     user.entries
  //     return res.json(user.entries);
  //   }
  // })
  // if(!found){
  //   res.status(400).json('not found');
  // }
})


//bcrypt
// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });


//PORT
app.listen(3000, ()=> {
  console.log('app is running on port 3000');
})
