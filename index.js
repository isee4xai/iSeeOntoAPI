require('dotenv').config();

const cors = require('cors')
const express = require('express');
const SPAQRL_ENDPOINT = process.env.SPAQRL_ENDPOINT;

const queries = require('./src/routes/queries');
const explainers = require('./src/routes/explainers');

const app = express();
const PORT = process.env.PORT || 3100;
app.use(express.json());
app.use(cors());
app.use(function (req, res, next) {
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
    );
    next();
});

// For testing purposes 
app.get("/", (req, res) => {
    res.send("iSee Onto API");
});

app.listen(PORT, () => {
    console.log(`API is listening on port ${PORT}`);
});

app.use('/api/onto/', queries);
app.use('/api/explainers/', explainers);
