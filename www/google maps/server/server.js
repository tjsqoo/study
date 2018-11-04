// express
var express = require('express');
var app = express();
app.use(express.static('../../common/'));
app.use(express.static('../client/'));

// request function
app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: '../client'
  });
});

app.listen(3000, function() {
    console.log('Conneted 3000 port!');
  });
  