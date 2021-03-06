//Require third-party modules
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoose = require('mongoose');
const config = require('config');
const bodyParser = require('body-parser');

//Require api routers and custom middleware
const categories = require('./routes/categories');
const companies = require('./routes/companies');
const locations = require('./routes/locations');
const orders = require('./routes/orders');
const products = require('./routes/products');
const subcategories = require('./routes/subcategories');
const suppliers = require('./routes/suppliers');
const templates = require('./routes/templates');
const users = require('./routes/users');
const auth = require('./routes/auth');
const cors = require('cors');
// const {authMiddleware} = require('./services/tokenAuth');

//Initialize express app
const app = express();

//Configuration
//Disabling morgan when testing the application
if(config.util.getEnv('NODE_ENV') !== 'test') {
    //use morgan to log at command line
    app.use(morgan('tiny'));
    console.log('Morgan enabled')
}

if(!config.get('jwtPrivateKey')){
    console.error('FATAL ERROR: jwtPrivateKey is not defined');
    process.exit(1);
}
app.options('*', cors());
app.use(cors({
    exposedHeaders: ['x-auth-token']
}));

//Configuring Mongoose
mongoose.connect(config.get('mongoConnectionString'), {useNewUrlParser: true, useCreateIndex: true});
//parse application/json and look for raw text  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: 'application/json'}));  
app.use(helmet());

//Hooking up api routers
app.use('/api/categories', categories);
app.use('/api/companies', companies);
app.use('/api/locations', locations);
app.use('/api/orders', orders);
app.use('/api/products', products);
app.use('/api/subcategories', subcategories);
app.use('/api/suppliers', suppliers);
app.use('/api/templates', templates);
app.use('/api/users', users);
app.use('/api/auth', auth);

//PORT
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

module.exports = app; //To test controllers