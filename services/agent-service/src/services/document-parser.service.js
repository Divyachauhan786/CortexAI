import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const parseDocument = async (file) => {
    if (!file) {
        throw new Error("File is required");
    }

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    const fileBuffer = fs.readFileSync(file.path);

    // =========================
    // PDF
    // =========================
    if (extension === ".pdf") {
        try {
            const parser = new PDFParse({
                data: fileBuffer,
            });

            const result = await parser.getText();

            await parser.destroy();

            return {
                text: result.text,
                pageCount: result.total,
                type: "pdf",
            };
        } catch (pdfError) {
            throw new Error(
                `PDF processing failed inside parser service: ${pdfError.message}`
            );
        }
    }

    // =========================
    // DOCX
    // =========================
    if (extension === ".docx") {
        try {
            const result = await mammoth.extractRawText({
                buffer: fileBuffer,
            });

            return {
                text: result.value,
                type: "docx",
            };
        } catch (docxError) {
            throw new Error(
                `DOCX processing failed inside parser service: ${docxError.message}`
            );
        }
    }

    throw new Error("Unsupported document type");
};