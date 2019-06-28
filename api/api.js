const express = require("express");
const apiRouter = express.Router();
const artistsRouter = require("./artists");

apiRouter.use("/artists", artistsRouter);

apiRouter.get("/", (req, res) => {
  console.log("nice");
})

module.exports = apiRouter;