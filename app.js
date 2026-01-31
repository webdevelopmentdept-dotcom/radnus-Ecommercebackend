const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const errorMiddleware = require('./middlewares/error');
const path = require("path");
const reviewRoutes = require("./routes/reviewRoute");
const app = express();
const cors = require("cors");


app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// config
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: 'backend/config/config.env' });
}

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://radnus-ecommerce-frontend.vercel.app" // future frontend deploy
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);


app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const order = require('./routes/orderRoute');
const payment = require('./routes/paymentRoute');
const walletRoute = require("./routes/walletRoute");
const supportRoutes = require("./routes/supportRoute");
const adminwallet = require("./routes/adminwalletRoute");
const cartRoutes = require("./routes/cartRoute");
const productRoutes = require("./routes/productRoute");

app.use("/api/v1", productRoutes);
app.use("/api/v1", adminwallet);
app.use("/api/v1", walletRoute);
app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', order);
app.use('/api/v1', payment);
app.use("/api/v1", reviewRoutes);
app.use("/api/v1", supportRoutes);
app.use("/api/v1", cartRoutes);

// error middleware
app.use(errorMiddleware);

module.exports = app;