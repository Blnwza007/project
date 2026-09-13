import express from "express";
import users from "../models/user.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { playerName, deviceId, score } = req.body;
        const normalizedName = playerName?.trim();

        if (!normalizedName || !deviceId) {
            return res.status(400).json({
                msgThai: "ต้องระบุ playerName และ deviceId",
                msgEng: "playerName and deviceId are required"
            });
        }

        const userByDevice = await users.findOne({ deviceId });
        const userByName = await users.findOne({ playerName: normalizedName });

        if (userByName && userByName.deviceId !== deviceId) {
            return res.status(409).json({
                msgThai: "ชื่อมีคนใช้ไปแล้ว",
                msgEng: "Username already taken"
            });
        }

        if (userByDevice) {
            userByDevice.playerName = normalizedName;
            await userByDevice.save();
            return res.status(200).json({
                msgThai: `ยืนยันชื่อ ${normalizedName} แล้ว (ของคุณเอง)`,
                msgEng: "User updated successfully",
                data: { playerName: normalizedName, deviceId }
            });
        }

        const user = new users({
            playerName: normalizedName,
            deviceId,
            score: score ?? 0,
        });
        await user.save();
        console.log(`สร้างบัญชี ${normalizedName} เสร็จแล้ว!!`);
        return res.status(201).json({
            msgThai: `สร้างบัญชี ${normalizedName} สำเร็จ!`,
            msgEng: "User created successfully",
            data: { playerName: normalizedName, deviceId }
        });
    } catch(error) {
        console.log(error)
        return res.status(500).json({
            msgThai: "เกิดข้อผิดพลาดในระบบ",
            msgEng: "Internal server error",
            error: error.message
        })
    }
})

export default router;
