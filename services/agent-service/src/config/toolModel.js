import llm from "./llm.js";
import toolRegistry from "../tools/tool.registry.js";

const toolModel = llm.bindTools(toolRegistry);

export default toolModel;