const express = require('express')
const indexRoute = require('./api/routes/index')
const authRoute = require('./api/routes/auth')
const shopRoute = require('./api/routes/shop')
const app = express();
const bodyparser = require('body-parser')


app.use(bodyparser.json())
app.use('/',indexRoute)
app.use('/auth',authRoute)
app.use('/shop', shopRoute);

module.exports = app;