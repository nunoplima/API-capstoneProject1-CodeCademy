const express = require("express");
const issuesRouter = express.Router({mergeParams: true});
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

issuesRouter.get("/", (req, res, next) => {
  db.all(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`,
    (error, rows) => {
      if (rows === []) { // (typeof rows === "undefined" && rows.length === 0)
        return res.status(200).send({series: rows});
      } else if (error) {
        const err = new Error(error);
        err.status = 404;
        next(err);
      } else {
        res.status(200).send({issues: rows});
      }
    }   
  );  
});

const validateFields  = (req, res, next) => {
  if (!req.body.issue.name || !req.body.issue.issueNumber || !req.body.issue.publicationDate || !req.body.issue.artistId) {
    const err = new Error("Required field(s) missing");
    err.status = 400;
    return next(err); 
  }   
  db.get(`SELECT * FROM Artist WHERE id = ${req.body.issue.artistId}`, 
    (error, row) => {
      if (!row) { 
        const err = new Error("The specified artist doesn't exist on the Database");
        err.status = 400;
        return next(err); 
      } else {
        next();
      }
    }
  );
};

issuesRouter.post("/", validateFields, (req, res, next) => {
  const issue = req.body.issue;
  db.run(`INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id)
    VALUES ($name, $issue_number, $publication_date, $artist_id, $series_id)`,
    {
      $name: issue.name,
      $issue_number: issue.issueNumber,
      $publication_date: issue.publicationDate,
      $artist_id: issue.artistId,
      $series_id: req.params.seriesId
    },
    function(error) {
      if (error) {
        const err = new Error(error);
        return next(err);
      }
      db.get(`SELECT * FROM Issue WHERE id = ${this.lastID}`,
        (error, row) => {
          if (error) {
            const err = new Error(error);
            next(err);
          } else {
            res.status(201).send({issue: row})
          }
        }  
      );
    }
  );
});

issuesRouter.param("issueId", (req, res, next, id) => {
  db.get(`SELECT * FROM Issue WHERE id = ${id}`, 
    (error, row) => {
      if (!row) {
        const err = new Error("The specified issue doesn't exist on the Database");
        err.status = 404;
        return next(err); 
      }
      req.issue = row;
      next();
    }
  )
});

issuesRouter.put("/:issueId", validateFields, (req, res, next) => {
  const issue = req.body.issue;
  db.run(`UPDATE Issue SET 
    name = "${issue.name}",
    issue_number = "${issue.issueNumber}",
    publication_date = "${issue.publicationDate}",
    artist_id = "${issue.artistId}"
    WHERE id = ${req.params.issueId}`,
    (error) => {
      if (error) {
        const err = new Error(error);
        next(err);
      } else {
        db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId}`,
          (error, row) => {
            if (error) {
              const err = new Error(error);
              err.status = 404;
              return next(err);
            }
            return res.status(200).send({issue: row});
          }
        );
      }
    }   
  );
});

issuesRouter.delete("/:issueId", (req, res, next) => {
  db.run(`DELETE FROM Issue WHERE id = ${req.params.issueId}`,
    (error) => {
      if (error) {
        const err = new Error(error);
        err.status = 400;
        next(err);
      } else {
        res.sendStatus(204);
      }
    }
  );
});

module.exports = issuesRouter;
