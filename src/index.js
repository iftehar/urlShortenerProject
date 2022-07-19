const express = require('express');
var bodyParser = require('body-parser');
const mongoose  = require("mongoose");
const route = require('./routes/route.js');
const app = express();



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose
  .connect(
    "mongodb+srv://iftekhar:Iftekhar123@cluster0.omtag.mongodb.net/group38Database?retryWrites=true&w=majority"
    
    ,
    {
      useNewUrlParser: true,
    }
  )
  .then(() => console.log(" HELLO MR.KISHAN MongoDb is connected"))
  .catch((err) => console.log(err));

app.use('/', route);

app.listen(process.env.PORT || 3000, function() {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});
