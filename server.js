const port = 3000;
const express = require('express');
const app = express();

const driverDir = './driver';
const projectDir = './app/';
/*
app.get('/', (req, res) => {
    res.sendFile('./driver/', { root: '.' });
});*/
app.use(express.static(projectDir));

app.listen(port);