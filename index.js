const express=require('express');
const { MongoClient } = require('mongodb');
const app=express();
const port=process.env.PORT||5000;
const cors=require('cors');
require('dotenv').config();
const ObjectId=require('mongodb').ObjectId;

// middle ware 
app.use(cors())
app.use(express.json());

// connect to Mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rrj86.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri);

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
app.put('/users/admin',async(req,res)=>{
    const user=req.body;
    // console.log('put',user);
    const filter={email:user.email};
    const updateDoc={$set:{role:'admin'}};
    const result=await usersCollection.updateOne(filter,updateDoc);
    res.json(result);
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
app.get('/appointments',async(req,res)=>{
    const email=req.query.email;
    const date=new Date(req.query.date).toLocaleDateString();
    const query={email:email,date:date};
    const cursor=appointmentsCollection.find(query);
    const appointments=await cursor.toArray();
    res.json(appointments);
});


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