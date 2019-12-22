const functions = require('firebase-functions');
const admin = require('firebase-admin');
const firebase = require('firebase');
const app = require('express')();
const firebaseConfig = require('./config');

admin.initializeApp();

firebase.initializeApp(firebaseConfig);

// Get a list of screams
app.get('/screams', (req, res) => {
    admin
      .firestore()
      .collection("screams")
      .orderBy('createdAt','desc')
      .get()
      .then(data => {
        let screams = [];
        data.forEach(doc => {
          screams.push({
              screamId: doc.id,
              body: doc.data().body,
              userHandle: doc.data().userHandle,
              createdAt: doc.data().createdAt,
          });
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
    createdAt: new Date().toISOString(),
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

// signup route
app.post('/signup', (req, res)=> {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }
    // TODO: validate data
    firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then(data => {
        return res.status(201).json({'message':`user ${data.user.uid} signed up successfully`});
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({error: err.code});
    })
})
// https://baseurl.com/api/
exports.api = functions.https.onRequest(app);