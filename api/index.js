var bodyParser = require('body-parser')
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }));
let serviceAccount = require('./config.json');
const admin = require('firebase-admin');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
}); let db = admin.firestore();
app.use(bodyParser.json());
app.listen(3000, () => {
  console.log("El servidor está inicializado en el puerto 3000");
});
app.post('/api/room/availability', async function (req, res) {
  await db.collection("HABITACIONES").where('type', '==', req.body.type).get().then(async (data) => {
    let map = '{"respuesta":[';
    for (let index = 0; index < data.docs.length; index++) {
      const element = data.docs[index];
      let idelemento = element.id;
  
      let checkout = new Date(req.body.checkout.split('/')[2]+"-"+req.body.checkout.split('/')[1]+"-"+req.body.checkout.split('/')[0]).getTime();
      let checkin = new Date(req.body.checkin.split('/')[2]+"-"+req.body.checkin.split('/')[1]+"-"+req.body.checkin.split('/')[0]).getTime();
      let disponible = true;
      await db.collection("HABITACIONES").doc(idelemento).collection("Reservas").get().then((data2) => {
        let reservas = [];
        if (!data2.empty) {
          for (let index2 = 0; index2 < data2.docs.length; index2++) {
            const element2 = data2.docs[index2];
            console.log(element2.data().checkin,req.body.checkin)
            let firecheckin = new Date(element2.data().checkin.split('/')[2]+"-"+element2.data().checkin.split('/')[1]+"-"+element2.data().checkin.split('/')[0]).getTime();
            let firecheckout = new Date(element2.data().checkout.split('/')[2]+"-"+element2.data().checkout.split('/')[1]+"-"+element2.data().checkout.split('/')[0]).getTime();
            console.log(firecheckin, firecheckout, checkin, checkout)
            if (((firecheckin > checkout && firecheckin > checkin) ||
              (firecheckout < checkin && firecheckout < checkout))) {
            } else {
              disponible = false;
            }
            let pibot
            if (index2 + 1 == data2.docs.length) {
              pibot = '{ "idreserva":"' + element2.id + '", "checkin":"' + element2.data().checkin + '", "checkout":"' + element2.data().checkout + '" }';
            } else {
              pibot = '{ "idreserva":"' + element2.id + '", "checkin":"' + element2.data().checkin + '", "checkout":"' + element2.data().checkout + '" },';
            } 
            reservas += pibot;
          }

        }
        if (index + 1 == data.docs.length) {
          map += '{ "data":{"type":' + element.data().type + ', "id":"' + element.data().id + '"},"Reservas":[' + reservas + '], "disponible":' + disponible + ', "idelemento":"' + idelemento + '"}';
        } else {
          map += '{ "data":{"type":' + element.data().type + ', "id":"' + element.data().id + '"},"Reservas":[' + reservas + '], "disponible":' + disponible + ', "idelemento":"' + idelemento + '"},';
        }

      })
      if (index + 1 == data.docs.length) {
        map += "]}"
        res.send(map);
      }
    }
  })
})
app.post('/api/room/reservation', async function (req, res) {
  console.log(req.body.id);
  await db.collection("HABITACIONES").where('id', '==', req.body.id).get().then(async (data) => {
    await db.collection("HABITACIONES").doc(data.docs[0].id).collection("Reservas").add({ checkin: req.body.checkin, checkout: req.body.checkout }).then(() => {
      res.send({"mensage":"Se agrego la reserva"});
    })
  })
});
app.put('/api/room/reservation', function (req, res) {
  console.log(req)
  db.collection("HABITACIONES").where('id', '==', req.body.idhabitacion).get().then((data) => {
    db.collection("HABITACIONES").doc(data.docs[0].id).collection("Reservas").doc(req.body.idreserva).set({ checkin: req.body.checkin, checkout: req.body.checkout }).then(() => {
      res.send({"mensage":"Se modifico la reserva"});
    })
  })
})
app.delete('/api/room/reservation', function (req, res) {
  console.log(req)
  db.collection("HABITACIONES").where('id', '==', req.query.idhabitacion).get().then((data) => {
    db.collection("HABITACIONES").doc(data.docs[0].id).collection("Reservas").doc(req.query.idreserva).delete().then(() => {
      res.send({"mensage":"Se elimino la reserva"});
    });
  })
})


