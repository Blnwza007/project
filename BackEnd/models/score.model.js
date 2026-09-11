import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema({
    playerName: { type: String, required: true },
    deviceId:   { type: String },
    score:      { type: Number, required: true },
    level:      { type: Number, default: 1 },
    date:       { type: Date,   default: Date.now },
});

export default mongoose.model("scores", scoreSchema);