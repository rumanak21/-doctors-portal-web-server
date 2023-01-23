const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { response } = require('express');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bsyo8.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const serviceCollection = client.db("doctors_portal_web").collection("services");
        const bookingCollection = client.db("doctors_portal_web").collection("bookings");


        app.get('/available', async (req, res) => {
            const date = req.query.date || 'Dec 4, 2022'

            //Step 1: get all services.

            const services = await serviceCollection.find().toArray();


            //Step 2: get the booking of that day.
            const query = { date: date }
            const bookings = await bookingCollection.find(query).toArray();

            // Step 3: for each service, find bookings for that service
            services.forEach(service => {
                const serviceBookings = bookings.filter(b => b.treatment === service.name);
                // service.booked = serviceBookings.map(s=> s.slot);
                const booked = serviceBookings.map(s => s.slot);

                const available = service.slot.filter(s => !booked.includes(s))
                service.available = available;
            })
            res.send(services);
        })


        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const service = await cursor.toArray();
            res.send(service);
        })

        app.get('/booking', async (req, res) => {
            const patient = req.query.patient;
            const query = { patient: patient };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })


        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists });
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
        })


    }

    finally {


    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from Doctors Web!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})