const express = require("express");
const router = express.Router();

const connpool = require("../../dbconn");
const mysql = require("mysql");

router.get("/", (req, res) => {
  let sql = "SELECT * from product";
  connpool.query(sql, (error, results, fields) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

router.post("/searchproduct", (req, res) => {
  let bodyData = req.body;
  let name = "%" + bodyData.name + "%";
  let sql ="SELECT * FROM product WHERE product_name LIKE ? AND price BETWEEN ? AND ?";
  sql = mysql.format(sql, [name, bodyData.minpice, bodyData.maxpice]);

  connpool.query(sql, (error, results, fields) => {
    if (error) {
      res.status(500).json({ message: "Database error" });
    }

    if (results.length > 0) {
      let product_st = [];
      for (let i = 0; i < results.length; i++) {
        let { created_at, updated_at, ...rest } = results[i];
        product_st[i] = rest;
      }
      res.status(200).json(product_st);
    } else {
      res.status(404).json({ message: "No product found" });
    }
  });
});

router.post("/searchCart", (req, res) => {
  let bodydata = req.body;
  let cartName = "%" + bodydata.cart_name + "%";

  let sql = "SELECT * FROM cart WHERE customer_id = ? AND cart_name LIKE ?";
  sql = mysql.format(sql, [bodydata.customer_id, cartName]);

  connpool.query(sql, (error, results, fields) => {
    if (error) {
      res.status(500).json({ message: "Database error" });
    }

    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).json({ message: "No cart found" });
    }
  });
});

router.post("/createCart", (req, res) => {
  let bodydata = req.body;
  let cart_name = bodydata.cart_name;

  let checkSql = "SELECT * FROM cart WHERE customer_id = ? AND cart_name = ?";
  checkSql = mysql.format(checkSql, [bodydata.customer_id, cart_name]);

  connpool.query(checkSql, (error, results, fields) => {
    if (results.length > 0) {
      res.status(409).json({ message: "Cart name already exists" });
    }

    let carateCart = "insert into cart (customer_id, cart_name)" + "VALUES (?, ?)";
    carateCart = mysql.format(carateCart, [bodydata.customer_id, cart_name]);

    connpool.query(carateCart, (error, results, fields) => {
      if (error) {
        res.status(500).json({ message: "Database error" });
      }

      if (results.affectedRows === 1) {
        res.status(201).json({
          message: "created cart successful",
        });
      } else {
        res.status(405).json({
          message: "create cart failed",
        });
      }
    });
  });
});

router.post("/addProduct", (req, res) => {
  let bodydata = req.body;
  let sql ="select * from cart_item where cart_id = ? and product_id = ?";
  sql = mysql.format(sql, [bodydata.cart_id, bodydata.product_id]);

  connpool.query(sql, (error, results, fields) => {
    if (results.length > 0) {
      let quantitynumber = results[0].quantity;
      let newquantity = quantitynumber + bodydata.quantity;

      let sql = "update cart_item set quantity = ? where cart_id = ? and product_id = ?";
          sql = mysql.format(sql, [
                                newquantity,
                                bodydata.cart_id,
                                bodydata.product_id,
                            ]);

      connpool.query(sql, (error, results, fields) => {
        if (error) {
          res.status(500).json({ massage: "Database error" });
        }

        if (results) {
          res.status(201).json({
            message: "Product has been added to the cart.",
          });
        } else {
          res.status(405).json({
            message: "Failed",
          });
        }
      });
    } else {
      let insertSql ="INSERT INTO cart_item (cart_id, product_id, quantity) VALUES (?, ?, ?)";
      insertSql = mysql.format(insertSql, [
        bodydata.cart_id,
        bodydata.product_id,
        bodydata.quantity,
      ]);
      connpool.query(insertSql, (error, results, fields) => {
        if (error) {
          return res.status(500).json({ message: "Database error" });
        }

        if (results.affectedRows === 1) {
          res.status(201).json({
            message: "Product added to cart",
          });
        } else {
          res.status(404).json({
            message: "Product added to cart field",
          });
        }
      });
    }
  });
});

router.post('/viewCart',(req,res)=>{
    let {customer_id} = req.body;
    let sql = 
    'SELECT ' +
    'c.cart_id, ' +
    'c.cart_name, ' +
    'p.product_id, ' +
    'p.product_name, ' +
    'p.price, ' +
    'ci.quantity, ' +
    '(p.price * ci.quantity) AS total_price ' +
    'FROM cart c ' +
    'JOIN cart_item ci ON c.cart_id = ci.cart_id ' +
    'JOIN product p ON ci.product_id = p.product_id ' +
    'WHERE c.customer_id = ? ' +
    'ORDER BY c.cart_id';

    sql = mysql.format(sql, [customer_id]);

    connpool.query(sql,(error,results,fields)=>{
        if (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database query failed' });
        }

        let groupCart = {}
        results.forEach(row =>{
            if (!groupCart[row.cart_id]) {
                groupCart[row.cart_id] = [];
            }
            groupCart[row.cart_id].push({
                product_id: row.product_id,
                product_name: row.product_name,
                price: row.price,
                quantity: row.quantity,
                total_price: row.total_price
            });
        })
        res.json(groupCart)
    })
    
});

module.exports = router;
