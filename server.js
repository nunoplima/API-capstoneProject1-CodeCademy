// Packages
const express = require("express");
const cors = require("cors");
const errorHandler = require("errorhandler");
const bodyParser = require("body-parser");
const morgan = require("morgan");
// Router
const apiRouter = require("./api/api");

const app = express();

app.use(cors(), bodyParser.json(), morgan("dev"));
app.use("/api", apiRouter);

const PORT = process.env.PORT || 4000;

app.use(errorHandler());

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = app;