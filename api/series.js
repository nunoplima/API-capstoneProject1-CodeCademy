const express = require("express");
const seriesRouter = express.Router();
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

const issuesRouter = require("./issues");
seriesRouter.use("/:seriesId/issues", issuesRouter);

seriesRouter.param("seriesId", (req, res, next, id) =>{
  db.get(`SELECT * FROM Series WHERE id = ${id}`,
    (error, row) => {
      if (!row) {
        const err = new Error("Series not found");
        err.status = 404;
        next(err);
      } else {
        req.series = row;
        next();
      }
    }
  );
});

seriesRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Series",
    (error, rows) => {
      if (error) {
        const err = new Error(error.message);
        next(err)
      } else {
        res.status(200).send({series: rows});
      }
    }
  );
});


seriesRouter.get("/:seriesId", (req, res, next) => {
  res.status(200).send({series: req.series});
});

const validateFields = (req, res, next) => {
  if (!req.body.series.name || !req.body.series.description) {
    const err = new Error("Required field(s) missing");
    err.status = 400;
    next(err);
  } else {
    next()
  }
};

seriesRouter.post("/", validateFields, (req, res, next) => {
  db.run(`INSERT INTO Series (name, description) VALUES ("${req.body.series.name}", "${req.body.series.description}")`,
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
  db.run(`UPDATE Series SET name = "${req.body.series.name}", description = "${req.body.series.description}" WHERE id = ${req.params.seriesId}`,
    (error) => {
      if (error) {
        const err = new Error(error.message);
        next(err);
      } else {
        db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`,
          (error, row) => {
            res.status(200).send({series: row});
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
      const err = new Error(error);
      return next(err);
    } if (row) {
      return res.status(400).send("Series has issues init, can't delete");
    }
    db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId}`,
    (error) => {
      if (error) {
        const err = new Error(error);
        return next(err);
      }
      return res.sendStatus(204);
      }
    );
  });
});


module.exports = seriesRouter;