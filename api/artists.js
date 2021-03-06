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
  const artist = req.body.artist;
  artist.isCurrentlyEmployed = artist.isCurrentlyEmployed === 0 ? 0 : 1;
  if (artist.name && artist.dateOfBirth && artist.biography) {
    return next();
  }
  return res.sendStatus(400);
}

artistsRouter.post("/", validateFields, (req, res, next) => {
  const artist = req.body.artist;
  db.run(`INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES 
    ($name, $date_of_birth, $biography, $is_currently_employed)`,
    {
      $name: artist.name,
      $date_of_birth: artist.dateOfBirth,
      $biography: artist.biography,
      $is_currently_employed: artist.isCurrentlyEmployed
    },
    function(error) {
      if (error) {
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

artistsRouter.put("/:artistId", validateFields, (req, res, next) => {
  db.run(`UPDATE Artist SET
    name = $name, 
    date_of_birth = $date_of_birth, 
    biography = $biography, 
    is_currently_employed = $is_currently_employed
    WHERE id = $id`,
    {
      $name: req.body.artist.name, 
      $date_of_birth: req.body.artist.dateOfBirth, 
      $biography: req.body.artist.biography, 
      $is_currently_employed: req.body.artist.isCurrentlyEmployed,
      $id: req.params.artistId
    }, (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
          (error, row) => {
            res.status(200).send({artist: row});
          }
        );
      }
    }
  );
});

artistsRouter.delete("/:artistId", (req, res, next) => {
  db.run(`UPDATE Artist SET is_currently_employed = 0 WHERE id = ${req.artist.id}`,
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
          (error, row) => {
            res.status(200).send({artist: row});
          }
        );
      }
    }
  ); 
});


module.exports = artistsRouter;