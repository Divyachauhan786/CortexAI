import mongoose from "mongoose";
import fs from "fs";

import {
    parseDocument,
} from "../services/document-parser.service.js";

import {
    chunkDocument,
} from "../services/document-chunking.service.js";

import {
    generateEmbeddings,
} from "../services/embedding.service.js";

import {
    storeDocumentChunks,
} from "../services/qdrant.service.js";

export const uploadDocument = async (
    req,
    res
) => {
    try {
        console.log("[Document] Upload started");

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No document uploaded",
            });
        }

        const {
            userId,
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User information is not available. Please log in again.",
            });
        }

        console.log(`[Document] Parsing document: ${req.file.originalname}`);
        const parsedDocument =
            await parseDocument(req.file);

        if (!parsedDocument.text || !parsedDocument.text.trim()) {
            console.log(`[Document] Empty document: ${req.file.originalname}`);
            return res.status(400).json({
                success: false,
                message: "The document does not contain readable text.",
            });
        }

        console.log(`[Document] Chunking document`);
        const chunks =
            await chunkDocument(
                parsedDocument.text
            );
        
        console.log(`[Document] Created ${chunks.length} chunks`);

        if (chunks.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Failed to split document into readable chunks.",
            });
        }

        console.log(`[Document] Generating embeddings`);
        const chunksWithEmbeddings =
            await generateEmbeddings(
                chunks
            );
            
        console.log(`[Document] Embeddings generated`);

        const documentId =
            new mongoose.Types.ObjectId();

        console.log(`[Document] Storing vectors in Qdrant`);
        const qdrantResult =
            await storeDocumentChunks({
                userId,

                documentId,

                documentName:
                    req.file.originalname,

                chunks:
                    chunksWithEmbeddings,
            });
            
        console.log(`[Document] Stored ${qdrantResult.storedChunks} vectors`);

        return res.status(201).json({
            success: true,

            message:
                "Document processed and stored successfully",

            document: {
                documentId:
                    documentId.toString(),

                originalName:
                    req.file.originalname,

                type:
                    parsedDocument.type,

                pageCount:
                    parsedDocument.pageCount ||
                    null,

                totalChunks:
                    chunksWithEmbeddings.length,

                storedChunks:
                    qdrantResult.storedChunks,
            },
        });
    } catch (error) {
        console.error(
            "[Document] Processing error:",
            error
        );

        let errorMessage = "Failed to process document";
        
        if (error.message.includes("Only PDF and DOCX files are allowed")) {
            errorMessage = "Only PDF and DOCX files are supported.";
        } else if (error.message.includes("Failed to generate document embeddings")) {
            errorMessage = "Failed to generate document embeddings.";
        } else if (error.message.includes("Qdrant")) {
            errorMessage = "Document storage service is unavailable.";
        }

        return res.status(500).json({
            success: false,
            message: errorMessage
        });
    } finally {
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`[Document] Cleaned up temp file: ${req.file.path}`);
            } catch (cleanupError) {
                console.error(`[Document] Failed to clean up temp file ${req.file.path}:`, cleanupError);
            }
        }
    }
};