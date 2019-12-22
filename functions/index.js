const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');

admin.initializeApp();
const app = express();

// Get a list of screams
app.get('/screams', (req, res) => {
    admin
      .firestore()
      .collection("screams")
      .get()
      .then(data => {
        let screams = [];
        data.forEach(doc => {
          screams.push(doc.data());
        });
        return res.json(screams);
      })
      .catch(err => console.error(err));
})

// post a new scream to database
app.post('/scream', (req, res) => {
    const newScream = {
    userHandle: req.body.userHandle,
    body: req.body.body,
    createdAt: admin.firestore.Timestamp.fromDate(new Date())
    };

    admin
    .firestore()
    .collection("screams")
    .add(newScream)
    .then(doc => {
        res.json({ message: `document ${doc.id} created successfully` });
        return res;
    })
    .catch(err => {
        res.status(500).json({ error: "something went wrong" });
        console.error(err);
        return res;
    });
});

// https://baseurl.com/api/
exports.api = functions.https.onRequest(app);