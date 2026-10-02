import express from "express";

import {
    getUserMemories,
    removeMemory,
    removeAllMemories,
} from "../controllers/memory.controller.js";


const router = express.Router();


router.get("/", getUserMemories);

router.delete("/:key", removeMemory);

router.delete("/", removeAllMemories);


export default router;