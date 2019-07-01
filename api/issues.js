const express = require("express");
const issuesRouter = express.Router({mergeParams: true});
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || "./database.sqlite");

issuesRouter.param("issueId", (req, res, next, id) => {
  db.get(`SELECT * FROM Issue WHERE id = ${id}`, 
    (error, row) => {
      if (error) {
        next(error);
      }
      else if (!row) {
        return res.status(404).send("The specified issue doesn't exist on the Database") 
      } else {
        next();
      }      
    }
  )
});

issuesRouter.get("/", (req, res, next) => {
  db.all(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`,
    (error, rows) => {
      if (rows === []) { // (typeof rows === "undefined" && rows.length === 0)
        return res.status(200).send({series: rows});
      } else if (error) {
        next(error);
      } else {
        res.status(200).send({issues: rows});
      }
    }   
  );  
});

const validateFields  = (req, res, next) => {
  const issue = req.body.issue
  if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId) {
    return res.status(400).send("Required field(s) missing"); 
  }   
  db.get(`SELECT * FROM Artist WHERE id = ${issue.artistId}`, 
    (error, row) => {
      if (!row) { 
        return res.status(400).send("The specified artist doesn't exist on the Database");
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
        return next(error);
      }
      db.get(`SELECT * FROM Issue WHERE id = ${this.lastID}`,
        (error, row) => {
          if (error) {
            next(error);
          } else {
            res.status(201).send({issue: row})
          }
        }  
      );
    }
  );
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
        next(error);
      } else {
        db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId}`,
          (error, row) => {
            if (error) {
              return res.sendStatus(404);
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
        res.sendStatus(400);
      } else {
        res.sendStatus(204);
      }
    }
  );
});

module.exports = issuesRouter;
