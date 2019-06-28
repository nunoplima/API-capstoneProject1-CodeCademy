// Packages
const express = require("express");
const cors = require("cors");
const errorHandler = require("errorhandler");
const bodyParser = require("body-parser");
const morgan = require("morgan");
// Router
const apiRouter = require("./api/api");

const app = express();

app.use(cors(), errorHandler(), bodyParser.json(), morgan("dev"));
app.use("/api", apiRouter);

const PORT = process.env.PORT || 8081;

const errorHandlerFn = (err, req, res) => {
  console.log("heeee");
  if (!err.status) {
    err.status = 500;
  } else {
    res.sent(err.status).send(err.message);
  }
}

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = app;