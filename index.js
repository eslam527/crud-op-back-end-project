const express = require('express');
const { json } = require('express/lib/response');
const mysql2 = require('mysql2');
const port =3000;
const app = express();


const  dB = mysql2.createConnection({
    host :'127.0.0.1',
    user:'root',
    password:'',
    database:'store'
});

dB.connect(err=>{
if(err){
    console.error('fail to connect dataBase');
    
}else{
    console.log('dataBase is running');

}
})

app.use(express.json());

app.post('/creat/table',(req,res,next)=>{
dB.execute(`CREATE TABLE users (
    u_id INT PRIMARY KEY AUTO_INCREMENT,
    u_fname VARCHAR(250) NOT NULL,
    u_lname VARCHAR(250) NOT NULL,
    u_email VARCHAR(250) UNIQUE NOT NULL,
    u_password VARCHAR(200) NOT NULL,
    u_role BOOLEAN NOT NULL DEFAULT FALSE,
    u_updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`,((err,data)=>{
    if (err) {
        if (err.code === "ER_TABLE_EXISTS_ERROR") {
            return res.status(401).json({ message: 'Table (users) already exists' });
        } else {
            console.error("Error creating table:", err);
            return res.status(500).json({ message: 'Failed to create table'});
        }
    }
    return res.status(200).json({ message: 'Table created successfully'});

}));

});
app.post('/user/signUp',(req,res,next)=>{
    const {email ,firstNasme,lastName ,password,role} = req.body;
    dB.execute(`SELECT u_email FROM users where u_email=?`,[email],(err,data)=>{
        if(err){
            return res.status(500).json({message:'fail to excute data'});
        }else if (data.length){
            return res.status(409).json({message:'email is exist'})
        }
        else{
            dB.execute(`INSERT INTO users (u_fname,u_lname,u_email,u_password,u_role) VALUES(?,?,?,?,?)`,[firstNasme,lastName,email ,password,role],(err,data=>{
                if(err){
                    return res.status(500).json({message:'fail to excute data'});
                }
                else{
                    return res.status(201).json({message:`User added successfully`})

                }
            }))
        }
    })
});
app.post('/user/logIn',(req,res)=>{
    const {email,password} = req.body;
    dB.execute( `SELECT u_id FROM users WHERE u_email=? and u_password=? `,[email,password],(err,data)=>{
        if(err){
            return res.status(500).json({message:'fail to excute data',err});
        }
        else if(!data.length){
            return res.status(404).json({message:'Invalid credentials'});
        }
        else{
            return res.status(200).json({message:'done'});
        }





    });
});
app.post('/admen/creating',(req,res,next)=>{
    const {email , password} = req.body
    dB.execute(`SELECT u_role FROM users WHERE u_email=? and u_password=?`,[email,password],(err,data)=>{
        if(err){
            return res.status(500).json(({message:'can not excute the data'},err))
        }else if(data[0]?.u_role){
            // return res.status(200).json({message:'done',data});
            dB.execute(`ALTER TABLE users 
        ADD COLUMN createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,(err,data)=>{
            if(err){
                return res.status(500).json(({message:'can not excute the data'},err))
            }else{
                return res.status(200).json(({message:'done'}))

            }
        })
        }else{
            return res.status(404).json({message:'you have not access'})

        }
    })
});
app.post('/admen/truncate',(req,res,next)=>{
    const {email , password} = req.body
    dB.execute(`SELECT u_role FROM users WHERE u_email=? and u_password=?`,[email,password],(err,data)=>{
        if(err){
            return res.status(500).json(({message:'can not excute the data'},err))
        }else if(data[0]?.u_role){
            // return res.status(200).json({message:'done',data});
            dB.execute(`TRUNCATE TABLE products;`,(err,data)=>{
            if(err){
                return res.status(500).json(({message:'can not excute the data'},err))
            }else{
                return res.status(200).json(({message:'done'}))

            }
        })
        }else{
            return res.status(404).json({message:'you have not access'})

        }
    })

});
app.post('/creat/proudctsTable',(req,res,next)=>{
    dB.execute(`CREATE TABLE products (
        pr_id INT PRIMARY KEY AUTO_INCREMENT,
        pr_name VARCHAR(250) NOT NULL,
        pr_stock VARCHAR(200) NOT NULL,
        pr_isdelete BOOLEAN NOT NULL DEFAULT FALSE,
        pr_price INT,
        u_id INT NOT NULL,
        CONSTRAINT FK_U_B FOREIGN KEY (u_id) REFERENCES users(u_id) ON DELETE CASCADE ON UPDATE CASCADE,
        pr_createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        pr_updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`,((err,data)=>{
        if (err) {
            if (err.code === "ER_TABLE_EXISTS_ERROR") {
                return res.status(401).json({ message: 'Table (users) already exists' });
            } else {
                return res.status(500).json({ message: 'Failed to create table'});
            }
        }
        return res.status(200).json({ message: 'Table created successfully'});
    
    }));
    
    });
app.post('/add/product',(req,res,next)=>{
    const {pName,pStock,pIsDelete,pPrice,userId} = req.body;
    console.log({pName,pStock,pIsDelete,pPrice,userId});
    
    dB.execute(`INSERT INTO products (pr_name,pr_stock,pr_isdelete,pr_price,u_id) VALUES(?,?,?,?,?)`,[pName,pStock,pIsDelete,pPrice,userId],(err,data)=>{
        if(err?.code === "ER_NO_REFERENCED_ROW_2"){
            return res.status(400).json({message:'invaled usert id'})
        }else if(data.affectedRows ) {
            return res.status(200).json({message:'product added',data})
        }
        else{
            return res.status(500).json({message:'can not excute the data'})

        }
    })
});
app.patch('/delete/product:id',(req,res,next)=>{
  const{id}= req.params;
  
  dB.execute(`UPDATE products SET pr_isdelete = 1 WHERE pr_id = ?`,[id],(err,data)=>{
    if(err){
        return res.status(500).json({message:'can not excute the data'});
    }else if(data.affectedRows){
        return res.status(200).json({message:'product is deleted'});

    }
    else{
        return res.status(200).json({message:'invaled id'});

    }
  })
});
app.delete('/delete/product:id',(req,res,next)=>{
    const {id}= req.params;
    dB.execute(`DELETE FROM products WHERE pr_id = ?`,[id],(err,data)=>{
        if(err){
            return res.status(500).json({message:'can not excute the data'});
        }else if(data.affectedRows){
            return res.status(200).json({message:'product is deleted'});
    
        }
        else{
            return res.status(200).json({message:'invaled id'});
    
        }
        })
});
app.get('/get/product:id',(req,res,next)=>{
    const {id} = req.params;
    console.log(id);
    
    dB.execute(`SELECT * FROM products WHERE pr_id =?`,[id],(err,data)=>{
            if(err){
                return res.status(500).json({message:'can not excute the data',err});
            }else if( data.length) {
                return res.status(200).json({message:data});
        
            }
        else{
            return res.status(404).json({ message: 'Product not found' });
   
        }
    })
});
app.post('/get/products',(req,res,next)=>{
    const {id} = req.query
if (!id) {
    return res.status(400).json({ message: 'Product ID is required' });
}
const idArray = id.split(',').map(id => Number(id.trim()));
console.log(idArray);
const placeholders = idArray.map(() => '?').join(', ');
console.log(placeholders);
console.log(idArray);

dB.execute(`SELECT pr_id, pr_name, pr_price FROM products WHERE pr_id IN (${placeholders});`,idArray,(err,data)=>{
    if(err){
        return res.status(500).json({message:'can not excute the data'});

    }else{
        return res.status(200).json({message:data});

    }
})
});
app.get('/get/products/active', (req, res, next) => {
    dB.execute(`SELECT pr_name AS productName, pr_price AS cost,pr_isdelete,pr_stock FROM products WHERE pr_isdelete = 0`, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Cannot execute the data', err });
        } else {
            return res.status(200).json({ message: 'Active products retrieved successfully', data });
        }
    });
});
app.post('/get/productsOwner', (req, res, next) => {
    dB.execute(`
        SELECT pr_name AS productName, u_email AS userEmail
        FROM products pr
        JOIN users u ON pr.u_id = u.u_id
    `, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Cannot execute the data', err });
        } else {
            return res.status(200).json({ message: 'Products with owners retrieved successfully', data });
        }
    });
});
app.get('/get/maxPrice', (req, res, next) => {
    dB.execute(`SELECT MAX(pr_price) AS maxPrice FROM products`, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Cannot execute the data', err });
        } else {
            return res.status(200).json({ message: 'Maximum product price retrieved successfully', data });
        }
    });
});
app.get('/get/top-5-expensive-products', (req, res, next) => {
    dB.execute(`
        SELECT pr_name AS productName, pr_price AS price
        FROM products
        ORDER BY pr_price DESC
        LIMIT 5
    `, (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Cannot execute the data', err });
        } else {
            return res.status(200).json({ message: 'Top 5 most expensive products retrieved successfully', data });
        }
    });
});

// bonus 
// # Write your MySQL query statement below
// WITH ProductSales AS (
//     SELECT 
//         us.product_id,
//         us.units,
//         us.purchase_date,
//         p.price
//     FROM 
//         UnitsSold us
//     JOIN 
//         Prices p
//     ON 
//         us.product_id = p.product_id
//         AND us.purchase_date BETWEEN p.start_date AND p.end_date
// ), 
// AggregatedSales AS (
//     SELECT 
//         product_id,
//         SUM(price * units) AS total_revenue,
//         SUM(units) AS total_units
//     FROM 
//         ProductSales
//     GROUP BY 
//         product_id
// )
// SELECT 
//     p.product_id,
//     ROUND(COALESCE(a.total_revenue / a.total_units, 0), 2) AS average_price
// FROM 
//     (SELECT DISTINCT product_id FROM Prices) p
// LEFT JOIN 
//     AggregatedSales a
// ON 
//     p.product_id = a.product_id;



























































app.listen(port,()=>{
    console.log(`server is running in port :::::${port}`);
    
})
