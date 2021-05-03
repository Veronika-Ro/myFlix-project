const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const app = express();

app.use(bodyParser.json());

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
  
  app.get('/movies', (req, res) => {
    res.json(movies);
  });

  // GET requests for a specific movie
  app.get('/movies/:name', (req, res) => {
    res.json(movies.find((movies) =>
      { return movies.name === req.params.name }));
      // add error handler fo rmovies not found
  });

  // GET requests to be updated for genres and directors

  app.get('/genres', (req, res) => {
    res.send('Successful GET request returning data on all genres');
  });

  app.get('/directors', (req, res) => {
    res.send('Successful GET request returning data on all directors');
  });
 
  // POST requests to be updated 
  app.post('/users/:username', (req, res) => {
    res.send('Successful POST request adding a new user');;
  });

  app.post("/users/:username/favorites",(req,res)=>{
    res.send("movie added to favorites");
  });

// PUT requests to be updated 
  app.put('/users/:username', (req, res) => {
    res.send('username has been updated');;
} );

// DELETE requests to be updated 
  app.delete("/users/:username",(req,res)=>{
    res.send("user was deleted")
  });

  app.delete("/users/:username/favorites/:name",(req,res)=>{
    res.send("movie as removed from favorites")
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

  // listen for requests
  app.listen(8080, () =>{
    console.log('Your app is listening on port 8080.');
  });