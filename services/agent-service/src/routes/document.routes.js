import express from "express";

import upload from "../documents/upload.middleware.js";

import {
    uploadDocument,
} from "../controllers/document.controller.js";

import {
    searchDocuments,
} from "../controllers/retrieval.controller.js";

import {
    validateDocument,
} from "../middleware/validate.document.js";

const router = express.Router();

router.post(
    "/upload",
    upload.single("document"),
    validateDocument,
    uploadDocument
);

router.post(
    "/search",
    searchDocuments
);

export default router;