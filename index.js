const express = require('express');
const morgan = require('morgan');
const app = express();

let topMovies = [
    {
        title: 'Harry Potter and the Philosopher\'s Stone',
        studio: 'Warner Brothers'
    },
    {
        title: 'Lord of the Rings',
        studio: 'New Line Cinema'
    },
    {
        title: 'Frozen',
        studio: 'Disney'
    },
    {
        title: 'Star Wars',
        studio: 'Lucas Films'
    },
    {
        title: 'Avengers',
        studio: 'Marvel'
    }
  ];
  
  // GET requests
  app.get('/', (req, res) => {
    res.send('Welcome to the best Movie Collection!');
  });
  
  app.get('/movies', (req, res) => {
    res.json(topMovies);
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