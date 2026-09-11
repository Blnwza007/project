import express from "express";
import users from "../models/user.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { playerName, deviceId, score } = req.body;

        if (!playerName || !deviceId) {
            return res.status(400).json({
                msgThai: "ต้องระบุ playerName และ deviceId",
                msgEng: "playerName and deviceId are required"
            });
        }

        const userFind = await users.findOne({ playerName });

        if (userFind) {
            if (userFind.deviceId === deviceId) {
                // เครื่องเดิม เจ้าของชื่อเดิม — ให้ผ่าน ไม่ถือว่าเป็นชื่อซ้ำ
                return res.status(200).json({
                    msgThai: `ยืนยันชื่อ ${playerName} แล้ว (ของคุณเอง)`,
                    msgEng: "Name already reserved by this device",
                    data: { playerName, deviceId }
                });
            }
            // ชื่อนี้ถูกอีกเครื่องจองไปแล้ว
            return res.status(409).json({
                msgThai: "ชื่อมีคนใช้ไปแล้ว",
                msgEng: "Username already taken"
            });
        } else {
            const user = new users({
                playerName,
                deviceId,
                score: score ?? 0,
            });
            await user.save();
            console.log(`สร้างบัญชี ${playerName} เสร็จแล้ว!!`);
            return res.status(201).json({
                msgThai: `สร้างบัญชี ${playerName} สำเร็จ!`,
                msgEng: "User created successfully",
                data: { playerName, deviceId, score }
            })
        }
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
