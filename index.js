import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookie from 'cookie-parser'

import { customerRouter } from './src/customer/customer.route.js'
import { shopkeeperRouter } from './src/shopkeeper/shopkeeper.route.js'


// configurations
const app = express();
dotenv.config();

// Allow all origins (CORS)
app.use(cors());

app.use(cookie());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// middlewares and routings

app.get('/', (req, res) => {
  res.send("Buildkart is Healthy")
})


app.use('/api/v1/user', customerRouter)
app.use('/api/v1/owner', shopkeeperRouter)


app.get(/(.*)/, (req, res) => {
  res.send("PAGE NOT FOUND");
});


app.listen(process.env.PORT || 7000, "0.0.0.0", (req, res, next) => {
  console.log('app is listening on port : ', process.env.PORT || 3000);
})


app.use((err, req, res, next) => {

  console.error(err.stack)
  res.status(500).json({
    "success": false,
    "message": "internal server error"
  })
})

export default app;