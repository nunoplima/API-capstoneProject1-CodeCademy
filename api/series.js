const express = require("express");
const seriesRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

const issuesRouter = require("./issues");

seriesRouter.param("seriesId", (req, res, next, id) =>{
  db.get(`SELECT * FROM Series WHERE id = ${id}`,
    (error, row) => {
      if (!row) {
        res.sendStatus(404);
      } else {
        req.series = row;
        next();
      }
    }
  );
});


seriesRouter.use("/:seriesId/issues", issuesRouter); // para poder aproveiter a seriesRouter.param fn


seriesRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Series",
    (error, rows) => {
      if (error) {
        next(error)
      } else {
        res.status(200).json({series: rows});
      }
    }
  );
});

seriesRouter.get("/:seriesId", (req, res, next) => {
  res.status(200).json({series: req.series});
});

const validateFields = (req, res, next) => {
  const series = req.body.series;
  if (!series.name || !series.description) {
    res.status(400).send("Required field(s) missing");
  } else {
    next()
  }
};

seriesRouter.post("/", validateFields, (req, res, next) => {
  const series = req.body.series;
  db.run(`INSERT INTO Series (name, description) VALUES ("${series.name}", "${series.description}")`,
    function(error) {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`,
          (error, row) => {
            if (error) {
              next(error);
            } else {
              res.status(201).json({series: row});
            }
          }
        );
      }
    }
  );
});

seriesRouter.put("/:seriesId", validateFields, (req, res, next) => {
  const series = req.body.series;
  db.run(`UPDATE Series SET name = "${series.name}", description = "${series.description}" WHERE id = ${req.params.seriesId}`,
    (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`,
          (error, row) => {
            res.status(200).json({series: row});
          }
        );
      }
    }
  );
});

seriesRouter.delete("/:seriesId", (req, res, next) => { 
  db.get(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`,
    (error, row) => {
      if (error) {
        return next(error);
      } if (row) {
        return res.status(400).send("Series has issues init, can't delete");
      }
      db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId}`,
        (error) => {
          if (error) {
            return next(error);
          }
          return res.sendStatus(204);
        }
      );
    }
  );
});


module.exports = seriesRouter;