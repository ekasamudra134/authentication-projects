require("dotenv").config();
const connection = require("./model/database");
const express = require("express");
const jwt = require('jsonwebtoken')
const auth = require("./middleware/auth");

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));



app.post("/verify", async (req, res) => {
    const email =req.body.email;
    const password =req.body.password;
    
    
    connection.query("select * from user where email = "+ connection.escape(email) +"",(err,result)=>{
        if(err){
            console.log(err)
        } else {
            if((result[0].email)==email&&(result[0].password)==password){
                const token = jwt.sign({_email:email},process.env.TOKEN_KEY,
                    {
                      expiresIn: "2h",
                    });
                  connection.query(`UPDATE user SET token = `+ connection.escape(token) + `WHERE email = `+ connection.escape(email) +``,(err,result)=>{
                    if(err){
                        console.log(err)
                    }
                }
    
                );
                const refreshToken = jwt.sign({
                    _email:email
                }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
                connection.query(`UPDATE user SET refresh_token = `+ connection.escape(refreshToken) + `WHERE email = `+ connection.escape(email) +``,(err,result)=>{
                    if(err){
                        console.log(err)
                    } else {
                        res.send(result)
                    }
                }
    
                );
            }
            
        }
    }
    )
});

app.post('/refresh', (req, res) => {
    
    const refreshToken =req.body.refresh_token;
    
    const email=req.body.email;
  
        // Verifying refresh token
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, 
        (err, decoded) => {
            if (err) {
  
                // Wrong Refesh Token
                return res.status(406).json({ message: 'Unauthorized' });
            }
            else {
                // Correct token we send a new access token
                const token = jwt.sign({_email:email},process.env.TOKEN_KEY,
                    {
                      expiresIn: "2h",
                    });connection.query(`UPDATE user SET token = `+ connection.escape(token) + `WHERE refresh_token = `+ connection.escape(refreshToken) +``,(err,result)=>{
                        if(err){
                            console.log(err)
                        } else {
                            res.send(result)
                        }
                    }
        
                    );
            }
        }); return;
    
} );

app.post("/logout",auth, async (req, res) => {
    const email=req.body.email;

    connection.query("select * from user where email = "+ connection.escape(email) +"",(err,result)=>{
        if(err){
            console.log(err)
        } else {
            connection.query(`UPDATE user SET token = NULL WHERE email = `+ connection.escape(email) +``,(err,result)=>{
                if(err){
                    console.log(err)
                }
            }

            );
            connection.query(`UPDATE user SET refresh_token = NULL WHERE email = `+ connection.escape(email) +``,(err,result)=>{
                if(err){
                    console.log(err)
                } else {
                    res.send(result)
                }
            }

            )
        }
           
        }
    
    )
});




app.post("/welcome",auth, (req, res) => {
    res.status(200).send("Welcome 🙌 ");
  });



module.exports = app;