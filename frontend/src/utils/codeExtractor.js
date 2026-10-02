/**
 * Extracts code blocks from markdown content into file objects.
 * Supports HTML, CSS, JavaScript, Python, TypeScript, C++, etc.
 */
export const extractCodeFiles = (markdownContent) => {
    if (!markdownContent || typeof markdownContent !== "string") {
        return [];
    }

    const files = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)(?:\s+([a-zA-Z0-9_.-]+))?\n([\s\S]*?)```/g;

    let match;
    let fileIndex = 1;

    while ((match = codeBlockRegex.exec(markdownContent)) !== null) {
        let language = (match[1] || "").toLowerCase().trim();
        let fileName = (match[2] || "").trim();
        const content = match[3] || "";

        if (!fileName) {
            switch (language) {
                case "html":
                case "xml":
                    fileName = files.some((f) => f.name === "index.html")
                        ? `page_${fileIndex}.html`
                        : "index.html";
                    break;
                case "css":
                    fileName = files.some((f) => f.name === "style.css")
                        ? `style_${fileIndex}.css`
                        : "style.css";
                    break;
                case "js":
                case "javascript":
                    fileName = files.some((f) => f.name === "script.js")
                        ? `script_${fileIndex}.js`
                        : "script.js";
                    break;
                case "jsx":
                case "react":
                    fileName = `Component_${fileIndex}.jsx`;
                    break;
                case "ts":
                case "typescript":
                    fileName = `index_${fileIndex}.ts`;
                    break;
                case "py":
                case "python":
                    fileName = `main_${fileIndex}.py`;
                    break;
                case "cpp":
                case "c++":
                    fileName = `solution_${fileIndex}.cpp`;
                    break;
                case "json":
                    fileName = `data_${fileIndex}.json`;
                    break;
                case "sql":
                    fileName = `query_${fileIndex}.sql`;
                    break;
                default:
                    language = language || "text";
                    fileName = `file_${fileIndex}.${language === "text" ? "txt" : language}`;
                    break;
            }
        }

        files.push({
            name: fileName,
            language: language || "text",
            content: content.trim(),
        });

        fileIndex++;
    }

    return files;
};

/**
 * Builds combined HTML/CSS/JS for iframe live preview.
 */
export const buildPreviewDocument = (files) => {
    if (!files || files.length === 0) return "";

    const htmlFile = files.find((f) => f.name.endsWith(".html") || f.language === "html");
    const cssFile = files.find((f) => f.name.endsWith(".css") || f.language === "css");
    const jsFile = files.find(
        (f) =>
            (f.name.endsWith(".js") && !f.name.endsWith(".json")) ||
            f.language === "javascript" ||
            f.language === "js"
    );

    let htmlContent = htmlFile ? htmlFile.content : "";
    const cssContent = cssFile ? cssFile.content : "";
    const jsContent = jsFile ? jsFile.content : "";

    // If no HTML file is present, wrap other content nicely
    if (!htmlContent) {
        if (cssContent || jsContent) {
            htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
</head>
<body style="margin: 0; padding: 20px; font-family: system-ui, sans-serif; background: #0c0d14; color: #fff;">
    <div id="app"></div>
</body>
</html>`;
        } else {
            return "";
        }
    }

    // Inject CSS
    if (cssContent && !htmlContent.includes(`<style>${cssContent}</style>`)) {
        if (htmlContent.includes("</head>")) {
            htmlContent = htmlContent.replace(
                "</head>",
                `<style>\n${cssContent}\n</style>\n</head>`
            );
        } else {
            htmlContent = `<style>\n${cssContent}\n</style>\n` + htmlContent;
        }
    }

    // Inject JS
    if (jsContent && !htmlContent.includes(`<script>${jsContent}</script>`)) {
        if (htmlContent.includes("</body>")) {
            htmlContent = htmlContent.replace(
                "</body>",
                `<script>\n${jsContent}\n</script>\n</body>`
            );
        } else {
            htmlContent = htmlContent + `\n<script>\n${jsContent}\n</script>`;
        }
    }

    return htmlContent;
};
