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
.then(async () => {
    console.log("Conected to Mongodb");

    try {
        const collection = mongoose.connection.collection("users");
        const indexes = await collection.indexes();
        for (const idx of indexes) {
            if (idx.name !== "_id_") {
                await collection.dropIndex(idx.name);
                console.log(`ลบ index เก่า "${idx.name}" สำเร็จ`);
            }
        }
    } catch (e) {
        console.log("dropIndex error:", e.message);
    }
}).catch ((error) => {
    console.log("Conected failed", error);
})

app.use("/users", userRouter);

app.listen(PORT,() => {
    console.log(`Sever running on port${PORT}`);
})