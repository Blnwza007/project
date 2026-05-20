import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import "dotenv/config"
import userRouter from "./routes/user.route.js"

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, {
    tlsAllowInvalidCertificates: true
})
.then (()=> {
    console.log("Conected to Mongodb");
}).catch ((error) => {
    console.log("Conected failed", error);
})

app.use("/user", userRouter);

app.listen(PORT,() => {
    console.log(`Sever running on port${PORT}`);
})