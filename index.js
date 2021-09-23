const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const mongoose = require('mongoose');
const cors = require('cors');
const { check, validationResult } = require('express-validator');

const app = express();

/*Below is mongoose connection to the local DB
mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });*/
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());

//the code below allow access for all domains
app.use(cors());


let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User;

/**
  * GET request - loads home page
  */
app.get('/', (req, res) => {
  res.send('Welcome to the best Movie Collection!');
});


/**
 * GET request for ALL movies
 * @param {string} Title - title of the movie
 * @param {string} Description - description of the movie 
 * Object holding data about all movies. 
 * @returns {array} - Returns array of movie objects.
 */
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

/**
 * GET request for a specific movie, shows a movie card with title, description, genre and director
 * @param {string} Title - title of the movie
 * @param {string} Description - description of the movie 
 * @param {string} Director.Name - director of the movie
 * @param {string} Genre.Name - name of the genre of the movie 
 * @returns {object} - Returns a movie object.
 */

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

// GET requests for all users. Not required

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

/**
 * GET request for single users data
 * @param {string} UserName 
 * @returns {Object} Returns a user object.
 */

app.get('/users/:UserName', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ UserName: req.params.UserName })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * GET request for a genre, shows a genre card with name and description
 * @param {string} Genre.Name - genre's name
 * @param {string} Genre.Description - genre's description
 * @returns {object} - Returns a genre object.
 */

app.get('/movies/genre/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ 'Genre.Name': req.params.Name })
    .then((movie) => {
      res.json(movie.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

/**
 * GET request for a director, shows a director card with name, bio, death and birth
 * @param {string} Director.Name - director's name
 * @param {string} Director.Bio - director's bio
 * @param {date} Director.Birth - director's year of birth
 * @param {date} Director.Death - director's year of death
 * @returns {object} - Returns a director object.
 */

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

/**
 * Post request for users, used for registration of new users
 * @param {string} UserName 
 * @param {string} Password
 * @param {string} Email
 * @param {date} Birthday
 * @returns {Object} Returns a user object.
 */

app.post('/users',
  [
    check('UserName', 'Username is required').isLength({ min: 5 }),
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

/**
 * PUT request for users, used to update user info
 * @param {string} UserName 
 * @param {string} Password
 * @param {string} Email
 * @param {date} Birthday
 * @returns {Object} Returns a user object.
 */

app.put('/users/:UserName', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ UserName: req.params.UserName }, {
    $set:
    {
      UserName: req.body.UserName,
      Password: req.body.Password,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
});

/**
* DELETE request that deletes a USER by name
* @param {string} UserName
* @returns Returns a confirmation message.
*/
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

/**
 * POST request for adding a movie to a user's list of favorites.
 * @param {string} UserName
 * @param {string} MovieID
 * @returns Returns a confirmation message to the console with the updated user object.
 */

app.post('/users/:UserName/Movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ UserName: req.params.UserName }, {
    $push: { FavoriteMovies: req.params.MovieID }
  },
    { new: true }, //This line makes sure that the updated doc is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
});

/**
 * Removes a movie from a user's list of favorites.
 * @param {string} Username
 * @param {String} MovieID
 * @returns Returns a confirmation message with the updated user object. 
 */
app.delete('/users/:UserName/Movies/remove/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate({ UserName: req.params.UserName }, {
    $pull: { FavoriteMovies: req.params.MovieID }
  },
    { new: true },
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
});

//Return the documentation html

app.use(express.static('public'));
app.get('/documentation', (req, res) => {
  res.sendFile('public/documentation.html', { root: __dirname });
});

//log requests to terminal

app.use(morgan('common'));

//error handling

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// listen for requests- Now that people other than you will be using your app, you need to allow this port to change if necessary.
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});