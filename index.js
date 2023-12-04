const express = require('express');
require('dotenv').config();
const app=express();
const cors = require('cors');
var jwt = require('jsonwebtoken');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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

    const userCollection= client.db("diagonisticCenterDB").collection("users");
    const testsCollection= client.db("diagonisticCenterDB").collection("tests");
    const testBookCollection= client.db("diagonisticCenterDB").collection("testBook");
    const reviewsCollection= client.db("diagonisticCenterDB").collection("reviews");
    const paymentCollection= client.db("diagonisticCenterDB").collection("payments");
    
    // jwt
    app.post('/jwt',async(req,res)=>{
      const user=req.body;
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
      res.send({token});
    })
        // create a admin
        app.patch('/users/admin/:id',async(req,res)=>{
          const id=req.params.id;
          const  filter={_id : new ObjectId(id)};
          const updatedDoc={
            $set : {
              role : 'admin'
            }
          }
          const result =await userCollection.updateOne(filter,updatedDoc)
          res.send(result)
      })

    // check admin 
    app.get('/users/admin/:email' ,async(req,res)=>{
        const email=req.params.email;
        // if(email !==req.decoded?.email){
        //     return res.status(403).send({message:'unahthorized access'})
        // }
        const query={email:email}
        const user=await userCollection.findOne(query)
        let admin=false;
        if(user){
          admin =user?.role =='admin'
        }
        res.send({admin})
    })

    // middlewere
    const veryfyToken=(req,res,next)=>{
      console.log('inside veryfytoken',req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message:'forbidden access'})
      }
      const token=req.headers.authorization.split(' ')[1];
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          return res.status(401).send({message:'forbidden access'})
        }
        req.decoded=decoded
        next()
      })
    }
    // veryfy admin after veryfy token
    const veryfyAdmin=async(req,res,next)=>{
      const email=req.decoded.email;
      const query={email:email};
      const user = await userCollection.findOne(query);
      const isAdmin=user?.role=='admin';
      console.log(isAdmin);
      if(!isAdmin){
        return res.status(403).send({message:'forbidden access'})
      }
      next()
    }

     // get users to fronntend
     app.get('/users',async(req,res)=>{
     
      const result=await userCollection.find().toArray()
      res.send(result)
    })
    // 
      // get user
      app.get('/users/:email',async(req,res)=>{
        const query={email:req.params.email};
        const result=await userCollection.findOne(query)
        console.log(result);
        res.send(result)
      })
      


    // post user in mongoDb
    app.post('/users',async(req,res)=>{
      const user=req.body;
      // check user is exist to insert
      const query={email :user.email}
      const isexistingUser= await userCollection.findOne(query)
      if(isexistingUser){
        return res.send({message:'already exist',insertedId:null})
      }
      const result=await userCollection.insertOne(user);
      res.send(result)
    })
   
    // // for create admin
    // app.get('/usersAdmin',async(req,res)=>{
    //   const result=await userCollection.find().toArray()
    //   res.send(result)
    // })
   app.get('/users/:id',async(req,res)=>{
      const id=req.params.id
      const query={_id : new ObjectId(id)}
      const  result=await userCollection.findOne(query)
      res.send(result)
    })
    // delete users
    app.delete('/users/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)
    })

    //  already book check?
    app.get('/checkTestBooking/:userEmail/:testId', async (req, res) => {
      try {
        const { userEmail, testId } = req.params;
  
        // Check if there is a booking record for the user and test combination
        const existingBooking = await testBookCollection.findOne({ email: userEmail, testId });
  
        if (existingBooking) {
          // User  already  book kore thakle
          res.send({ alreadyBooked: true });
        } else {
          // User jodi book na kore 
          res.send({ alreadyBooked: false });
        }
      } catch (error){

      }})

      // get all booking test data
        app.get('/testBook',async(req,res)=>{
        const result=await testBookCollection.find().toArray()
        res.send(result)
    })

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

    // PUT route to update the status
app.put("/api/submitResult/:id", (req, res) => {
  const reservationId = req.params.id;
  const newStatus = req.body.status;

  const reservationIndex = testBook.findIndex((reservation) => reservation._id === reservationId);

  if (reservationIndex !== -1) {
    // Update the status
    testBook[reservationIndex].status = newStatus;
    res.json({ updatedCount: 1, message: "Status updated successfully" });
  } else {
    res.status(404).json({ updatedCount: 0, error: "Reservation not found" });
  }
});



    // delete booking test
    app.delete('/testBook/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)}
      const result=await testBookCollection.deleteOne(query)
      res.send(result)
    })
  //  add test in db
    app.post('/tests',async(req,res)=>{
      const body=req.body
      const result=await testsCollection.insertOne(body);
      res.send(result)
    })

    // get the tests info
    app.get('/tests',async(req,res)=>{
        const result=await testsCollection.find().toArray()
        res.send(result)
    })
    // delete test
    app.delete('/tests/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)}
      const result = await testsCollection.deleteOne(query)
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
    // update a test
    app.patch('/tests/:id',async(req,res)=>{
      const test=req.body;
      const id=req.params.id;
      const filter={_id : new ObjectId(id)}
      const updatedDoc={
        $set:{
          testName: test.testName,
        testDetails: test.testDetails,
        category: test.category,
        price: test.price,
        available_Dates: test.dates,
        slots: test.slots,
        test_title: test.testTitle,
        image: test.image,
        }
      }
        const result=await testsCollection.updateOne(filter,updatedDoc)
        res.send(result)
    })

    // get payment History
    app.get('/payments/:email',async(req,res)=>{
      const query={email:req.params.email};
      const result=await paymentCollection.find(query).toArray();
      console.log(result);
      res.send(result)
    })
    


    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      
      const amount = parseInt(price * 100);
      console.log(amount,'inisit the intent');

      const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ['card']

      })
      res.send({
          clientSecret: paymentIntent.client_secret,
      });
      
  })
  // post to payment collection
  app.post('/payments',async(req,res)=>{
    const payment=req.body;
    console.log(payment);
    const paymentResult=await paymentCollection.insertOne(payment)
    // now carefully delete each item from the card
    console.log('paymentInfo',payment);
    const query={_id: {
      $in :payment.testIds.map(id=> new ObjectId(id))
    }}
    const result=await testBookCollection.deleteMany(query)
    res.send({paymentResult,result})
  })

  

  
    


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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