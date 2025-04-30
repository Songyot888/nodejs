const express = require('express')
const router = express.Router();

const connpool = require('../../dbconn')
const mysql = require('mysql')
const bcrypt = require('bcrypt');

router.post('/register', async (req,res)=>{
    let bodyData = req.body;
    // await คือ การทำให้เสร็จก่อนแล้วค่อยไปคำสั่งถัดไป
    let  hashedPassword = await bcrypt.hash(bodyData.password, 10);
    let sql = 'INSERT INTO customer (first_name, last_name, email, password,phone_number,address)' + ' VALUES (?, ?, ?, ?, ?, ?)';
        sql = mysql.format(sql, [bodyData.first_name,
                                 bodyData.last_name,  
                                 bodyData.email,
                                 hashedPassword,
                                 bodyData.phone_number,
                                 bodyData.address]);

        connpool.query(sql, (error, results) => {
            if (error) {
                res.status(500).json({ message: 'Database error' });
            }

            if (results.affectedRows === 1) {
                res.status(201).json({ message: 'Registration successful' });
            } else {
                res.status(400).json({ message: 'Registration failed' });
            }
        });
});


router.post('/login', (req, res) => {
    let { email, password } = req.body;

    let sql = 'SELECT * FROM customer WHERE email = ?';
        sql = mysql.format(sql, [email])
    connpool.query(sql, (error, results) => {
        if (error) {
            res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            res.status(401).json({ message: 'Email not found' });
        }

        let user = results[0];

       bcrypt.compare(  password, user.password,  (error, rus) => {
        if (error) {
            res.status(500).json({ message: 'Error verifying password' });
        }
        if (rus) {
            //ผมใช้ ... เพื่อการแยกpassword ออกจากข้อมูลอันอื่น ซึ่งต้องเอาข้อมูลที่ต้องการแยกเอาไว้ด้านหน้าครับ
            let {password, ...userData} = user
            res.status(200).json(userData);
        } else {
            res.status(401).json({
                message: 'Invalid email or password'
            });
        }
       } )
    });
});

router.post('/changepwd', async (req,res)=>{
    let { email, password, newpassword } = req.body;

    let newwd = await bcrypt.hash(newpassword, 10);

    let sql = 'SELECT * FROM customer WHERE email = ?';

        sql = mysql.format(sql, [email])
    connpool.query(sql,(error,results)=>{
        if (error) {
            res.status(500).json({ message: 'Database error' });
        }

        if (results.length === 0) {
            res.status(401).json({ message: 'Email not found' });
        }
        let userData = results[0];
        bcrypt.compare(password,userData.password , (err, rus) => {
            if(err){
                res.status(404);
            }

            if (rus) {
                let sql = 'UPDATE customer SET password = ? WHERE email = ?';
                sql = mysql.format(sql, [newwd, email]);

                connpool.query(sql,(error,results)=>{
                    if (error) {
                        res.status(500).json({ message: 'Database error' });
                    }

                    if (results.affectedRows === 1) {
                        res.status(201).json({ message: 'changed Password successfully' });
                    } else {
                        res.status(400).json({ message: 'change Password  failed' });
                    }
                })
            }
            
        })
    })

})


module.exports = router