import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    playerName: { type: String, required: true, unique: true },
    deviceId:   { type: String, required: true, unique: true },
    score: { type: Number, required: true, default: 0 },
});

export default mongoose.model("users", userSchema);
