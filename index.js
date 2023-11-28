const express = require('express');
const app=express()
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port=process.env.PORT || 5000;

// middlewere
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.okjp9zn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const testsCollection= client.db("diagonisticCenterDB").collection("tests");
    const testBookCollection= client.db("diagonisticCenterDB").collection("testBook");
    const reviewsCollection= client.db("diagonisticCenterDB").collection("reviews");

    //  already book check?
    app.get('/checkTestBooking/:userEmail/:testId', async (req, res) => {
      try {
        const { userEmail, testId } = req.params;
  
        // Check if there is a booking record for the user and test combination
        const existingBooking = await testBookCollection.findOne({ email: userEmail, testId });
  
        if (existingBooking) {
          // User has already booked this test
          res.send({ alreadyBooked: true });
        } else {
          // User has not booked this test
          res.send({ alreadyBooked: false });
        }
      } catch (error){

      }})
      // get all test data to navbar
      app.get('/userTest',async(req,res)=>{
        const email=req.query.email
        const query={email:email}
        const result= await testBookCollection.find(query).toArray()
        res.send(result)
      })
    
    // testBook post
    app.post('/testBook',async(req,res)=>{
      const data=req.body;
      const result=await testBookCollection.insertOne(data);
      res.send(result)
    })


    // get the tests ingo
    app.get('/tests',async(req,res)=>{
        const result=await testsCollection.find().toArray()
        res.send(result)
    })
    // get test for details
    app.get('/tests/:id',async(req,res)=>{
      const id=req.params.id
      const query={_id : new ObjectId(id)}
      const  result=await testsCollection.findOne(query)
      res.send(result)
    })
    // reviews
    app.get('/reviews',async(req,res)=>{
        const result=await reviewsCollection.find().toArray();
        res.send(result)
    })
    


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("server is running")
})

app.listen(port,()=>{
    console.log(`server is runninig on port ${port}`);
})