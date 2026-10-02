import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { evaluate } from "mathjs";

const calculatorTool = tool(
    async ({ expression }) => {
        try {
            const result = evaluate(expression);

            return String(result);
        } catch (error) {
            return `Calculator error: ${error.message}`;
        }
    },
    {
        name: "calculator",
        description:
            "Use this tool to perform mathematical calculations accurately. Input should be a valid mathematical expression such as 25 * 4, 100 / 5, or sqrt(144).",
        schema: z.object({
            expression: z
                .string()
                .describe(
                    "Mathematical expression to calculate"
                ),
        }),
    }
);

export default calculatorTool;