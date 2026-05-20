import express from "express";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

const router = express.Router();

export default router;