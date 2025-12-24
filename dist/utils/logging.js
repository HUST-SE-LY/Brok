import fs from 'fs';
import path from 'path';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
export class FileCallbackHandler extends BaseCallbackHandler {
    name = 'file_callback_handler';
    filePath;
    constructor(filePath) {
        super();
        this.filePath = filePath;
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    async write(entry) {
        const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
        await fs.promises.appendFile(this.filePath, line);
    }
    async handleLLMStart(llm, prompts, runId) {
        await this.write({ type: 'llm_start', runId, prompts });
    }
    async handleLLMEnd(output, runId) {
        await this.write({ type: 'llm_end', runId, output });
    }
    async handleLLMError(err, runId) {
        await this.write({ type: 'llm_error', runId, error: String(err) });
    }
    async handleChainStart(chain, inputs, runId) {
        await this.write({ type: 'chain_start', runId, inputs });
    }
    async handleChainEnd(outputs, runId) {
        await this.write({ type: 'chain_end', runId, outputs });
    }
    async handleChainError(err, runId) {
        await this.write({ type: 'chain_error', runId, error: String(err) });
    }
    async handleToolStart(tool, input, runId) {
        await this.write({ type: 'tool_start', runId, tool: tool?.name, input });
    }
    async handleToolEnd(output, runId) {
        await this.write({ type: 'tool_end', runId, output });
    }
    async handleToolError(err, runId) {
        await this.write({ type: 'tool_error', runId, error: String(err) });
    }
}
