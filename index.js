import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookie from 'cookie-parser'

import { customerRouter } from './src/customer/customer.route.js'
import { shopkeeperRouter } from './src/shopkeeper/shopkeeper.route.js'


// configurations
const app = express();
dotenv.config();

app.use(cors());

app.use(cookie());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// middlewares and routings

app.get('/', (req, res) => {
  res.send("Shilajeet is Healthy")
})


app.use('/api/v1/user', customerRouter)
app.use('/api/v1/owner', shopkeeperRouter)


app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});


app.listen(process.env.PORT || 8001, "0.0.0.0", (req, res, next) => {
  console.log('app is listening on port : ', process.env.PORT || 8001);
})


app.use((err, req, res, next) => {

  console.error(err.stack)
  res.status(500).json({
    "success": false,
    "message": "internal server error"
  })
})

export default app;