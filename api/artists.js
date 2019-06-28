const express = require("express");
const artistsRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite"); // Doesn't work w/ full path...

artistsRouter.param("artistId", (req, res, next, id) => {
  db.get(`SELECT * FROM Artist WHERE id = ${id}`,
    (error, row) => {
      if (error) {
        next(error);
      }
      else if (!row) {
        res.sendStatus(404);
      } else {
        req.artist = row;
        next();
      }
    }
  );
});

artistsRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Artist WHERE is_currently_employed = 1",
  (error, rows) => {
    if (error) {
      error.status = 404;
      next(error);
    } else {
      res.status(200).json({artists: rows});
    }
  });
});

artistsRouter.get("/:artistId", (req, res) => {
  res.status(200).json({artist: req.artist});
});

const validateFields = (req, res, next) => {
  if (!req.body.artist.isCurrentlyEmployed) {
    req.body.artist.isCurrentlyEmployed = 1;
  }
  if (req.body.artist.name && req.body.artist.dateOfBirth && req.body.artist.biography) {
    return next();
  }
  return res.sendStatus(400);
}

artistsRouter.post("/", validateFields, (req, res, next) => {
  db.run(`INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES 
    ($name, $date_of_birth, $biography, $is_currently_employed)`,
    {
      $name: req.body.artist.name,
      $date_of_birth: req.body.artist.dateOfBirth,
      $biography: req.body.artist.biography,
      $is_currently_employed: req.body.artist.isCurrentlyEmployed
    },
    function(error) {
      if (error) {
        error.status = 500;
        next(error);
      } else {
        db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`,
          (error, row) => {
            res.status(201).json({artist: row});
          }
        );
      }
    }
  );
});


module.exports = artistsRouter;