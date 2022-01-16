const express=require('express');
const { MongoClient } = require('mongodb');
const app=express();
const port=process.env.PORT||5000;
const cors=require('cors');
require('dotenv').config();
const admin = require("firebase-admin");
const ObjectId=require('mongodb').ObjectId;
const stripe= require('stripe')(process.env.STRIPE_SECRET)
const serviceAccount =require('./doctors-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// middle ware 
app.use(cors())
app.use(express.json());

// connect to Mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rrj86.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri);

async function verifyToken(req,res,next){
    if(req?.headers?.authorization.startsWith('Bearer ')){
        const token=req.headers.authorization.split(' ')[1];

        try{
            const decodedUser= await admin.auth().verifyIdToken(token);
            req.decodedEmail=decodedUser.email;

        }
        catch{


        }
    }
    next();
}

async function run (){
try{
await client.connect();
console.log('database connected successfully');
const database=client.db('doctors_portal');
const appointmentsCollection=database.collection('appointments');
const usersCollection=database.collection('users');

// appointments post api
app.post('/appointments',async(req,res)=>{
const appointment=req.body;
const result=await appointmentsCollection.insertOne(appointment);
// console.log(result);
// res.send(result); or
res.json(result)
});

// get payment id
app.get('/appointments/:id',async(req,res)=>{
    const id=req.params.id;
    const query={_id:ObjectId(id)};
    const result=await appointmentsCollection.findOne(query);
    res.json(result);
})

// users Post api 
app.post('/users',async(req,res)=>{
const user=req.body;
const result=await usersCollection.insertOne(user);
res.json(result);
})

// upsert user api
app.put('/users',async(req,res)=>{
    const user=req.body;
    const filter={email:user.email};
    const options={upsert:true};
    const updateDoc={$set:user};
    const result=usersCollection.updateOne(filter,updateDoc,options);
    res.json(result);
})

// make an admin 
app.put('/users/admin',verifyToken,async(req,res)=>{
    const user=req.body;
    const requester=req.decodedEmail;
    if(requester){
        const requesterAccount=await usersCollection.findOne({email:requester});
        if(requesterAccount.role==='admin'){
            const filter={email:user.email};
            const updateDoc={$set:{role:'admin'}};
            const result=await usersCollection.updateOne(filter,updateDoc);
            res.json(result);
        }
    }
    else{
        res.status(403).json({message:'you do not have access to make admin !'})
    }
    // console.log('put',user);
})

// secure admin panel
app.get('/users/:email',async(req,res)=>{
    const email=req.params.email;
    const query={email:email};
    const user=await usersCollection.findOne(query);
    let isAdmin = false;
    if(user?.role === 'admin'){
     isAdmin = true;
    }
    res.json({admin: isAdmin});
})

// Get appointments api
app.get('/appointments',verifyToken,async(req,res)=>{
    const email=req.query.email;
    const date=new Date(req.query.date).toLocaleDateString();
    const query={email:email,date:date};
    const cursor=appointmentsCollection.find(query);
    const appointments=await cursor.toArray();
    res.json(appointments);
});

// stripe payment
 app.post('/create-payment-intent',async(req,res) => {
    const paymentInfo = req.body;
    const amount = paymentInfo.price * 100;
    const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: amount,
        payment_method_types: ['card']
    });
      res.json({clientSecret: paymentIntent.client_secret})
    })

// update payment info 
 app.put('/appointments/:id', async (req, res) => {
    const id = req.params.id;
    const payment = req.body;
    const filter = { _id: ObjectId(id)};
    const updateDoc = {
        $set: {
           payment: payment
        }
       };
          const result = await appointmentsCollection.updateOne(filter, updateDoc);
    res.json(result);
 })

}
finally{

    //await client.close();  
}

}

run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send("Hello Bangladesh")
});
app.listen(port,()=>{
    console.log('server is okay',port)
});