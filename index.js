const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const app = express();

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

/*Below is mongoose connection to the local DB
mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });*/

app.use(bodyParser.json());
//the code below allow access for all domains
app.use(cors()); 

/*Here we allow only 2 origins to get access to the API
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){ // If a specific origin isn’t found on the list of allowed origins
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message ), false);
    }
    return callback(null, true);
  }
}));*/

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

let movies = [
    {
        name: 'Harry Potter and the Philosopher\'s Stone',
        studio: 'Warner Brothers'
    },
    {
        name: 'Lord of the Rings',
        studio: 'New Line Cinema'
    },
    {
        name:'Frozen',
        studio: 'Disney'
    },
    {
        name: 'Star Wars',
        studio: 'Lucas Films'
    },
    {
        name: 'Avengers',
        studio: 'Marvel'
    }
  ];
  
  // GET requests for all movies
  app.get('/', (req, res) => {
    res.send('Welcome to the best Movie Collection!');
  });
  
  app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

  // GET requests for a specific movie
  app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
      .then((movie) => {
        res.json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

   // GET requests for all users

   app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.find()
      .then((users) => {
        res.status(200).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

   //Get request for a single user by username

   app.get('/users/:UserName', passport.authenticate('jwt', { session: false }),  (req, res) => {
    Users.findOne({ UserName: req.params.UserName })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });

  // GET requests for a genre

  app.get('/movies/genre/:Name', passport.authenticate('jwt', { session: false }),  (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.Name })
    .then((movie) => {
      res.json(movie.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

  // GET requests for a director

  app.get('/movies/director/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Name })
    .then((movie) => {
      res.json(movie.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});
 
  // POST requests 

  //Add a user
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post('/users',
  // Validation logic here for request
  //you can either use a chain of methods like .not().isEmpty()
  //which means "opposite of isEmpty" in plain english "is not empty"
  //or use .isLength({min: 5}) which means
  //minimum value of 5 characters are only allowed
  [
    check('UserName', 'Username is required').isLength({min: 5}),
    check('UserName', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {

  // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ UserName: req.body.UserName }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.UserName + ' already exists');
        } else {
          Users
            .create({
              UserName: req.body.UserName,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

// PUT request- update a user's info by username
/* We’ll expect JSON in this format
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}*/

  app.put('/users/:UserName', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ UserName: req.params.UserName }, { $set:
      {
        UserName: req.body.UserName,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
  });

// DELETE a user by username 
app.delete('/users/:UserName', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ UserName: req.params.UserName })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.UserName + ' was not found');
      } else {
        res.status(200).send(req.params.UserName + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

  //Return the documentation html

  app.use(express.static('public'));
  app.get('/documentation', (req, res) => {
	res.sendFile('public/documentation.html', {root: __dirname});
  });
  
  //log requests at terminal

  app.use(morgan('common'));
 
  //error handling

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  // listen for requests- Now that people other than you will be using your app, you need to allow this port to change if necessary.
  const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});
