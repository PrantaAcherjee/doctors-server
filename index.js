const express=require('express');
const { MongoClient } = require('mongodb');
const app=express();
const port=process.env.PORT||5000;
const cors=require('cors');
require('dotenv').config();

// middle ware 
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rrj86.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri);

async function run (){
try{
await client.connect();
console.log('database connected successfully');

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