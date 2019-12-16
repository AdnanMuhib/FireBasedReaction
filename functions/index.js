const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello World");
});

exports.getScreams = functions.https.onRequest((req, res) => {
    admin.firestore()
    .collection('screams')
    .get()
    .then(data => {
        let screams= [];
        data.forEach(doc => {
            screams.push(doc.data())
        });
        return res.json(screams);
    })
    .catch(err => console.error(err));
})

exports.createScreams = functions.https.onRequest((req, res) => {
    if(req.method !== 'POST') {
        return res.status(400).json({error:'Method Not Allowed'});
    }

    const newScream = {
        userHandle: req.body.userHandle,
        body: req.body.body,
        createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    };

    admin.firestore()
    .collection('screams')
    .add(newScream)
    .then(doc =>  {
        res.json({message: `document ${doc.id} created successfully`});
        return res;
    })
    .catch(err => {
        res.status(500).json({error: "something went wrong"});
        console.error(err);
        return res;
    });

});
