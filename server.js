const port = 3000;
const express = require('express');
const app = express();

const projectDir = '.';

app.use(express.static(projectDir));

app.listen(port);