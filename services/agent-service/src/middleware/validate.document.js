const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const validateDocument = (req, res, next) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({
            success: false,
            message: "Document file is required.",
        });
    }

    const originalName = file.originalname || "";
    const extension =
        originalName.substring(originalName.lastIndexOf(".")).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return res.status(400).json({
            success: false,
            message: "Only PDF and DOCX files are allowed.",
        });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
            success: false,
            message: "Invalid document type.",
        });
    }

    if (file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
            success: false,
            message: "File size must not exceed 10 MB.",
        });
    }

    next();
};