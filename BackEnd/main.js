import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import "dotenv/config"
import userRouter from "./routes/user.route.js"
import scoreRouter from "./routes/score.route.js"

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI, {
    tlsAllowInvalidCertificates: true
})
.then(() => {
    console.log("Conected to Mongodb");
}).catch ((error) => {
    console.log("Conected failed", error);
})

app.use("/users", userRouter);
app.use("/scores", scoreRouter);

app.listen(PORT,() => {
    console.log(`Sever running on port${PORT}`);
})