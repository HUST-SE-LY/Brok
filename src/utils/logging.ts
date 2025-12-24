import fs from 'fs';
import path from 'path';
import { BaseCallbackHandler } from '@langchain/core/callbacks/base';

export class FileCallbackHandler extends BaseCallbackHandler {
  name = 'file_callback_handler';
  private filePath: string;

  constructor(filePath: string) {
    super();
    this.filePath = filePath;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private async write(entry: Record<string, any>) {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n';
    await fs.promises.appendFile(this.filePath, line);
  }

  async handleLLMStart(llm: any, prompts: string[], runId?: string) {
    await this.write({ type: 'llm_start', runId, prompts });
  }

  async handleLLMEnd(output: any, runId?: string) {
    await this.write({ type: 'llm_end', runId, output });
  }

  async handleLLMError(err: any, runId?: string) {
    await this.write({ type: 'llm_error', runId, error: String(err) });
  }

  async handleChainStart(chain: any, inputs: any, runId?: string) {
    await this.write({ type: 'chain_start', runId, inputs });
  }

  async handleChainEnd(outputs: any, runId?: string) {
    await this.write({ type: 'chain_end', runId, outputs });
  }

  async handleChainError(err: any, runId?: string) {
    await this.write({ type: 'chain_error', runId, error: String(err) });
  }

  async handleToolStart(tool: any, input: any, runId?: string) {
    await this.write({ type: 'tool_start', runId, tool: tool?.name, input });
  }

  async handleToolEnd(output: any, runId?: string) {
    await this.write({ type: 'tool_end', runId, output });
  }

  async handleToolError(err: any, runId?: string) {
    await this.write({ type: 'tool_error', runId, error: String(err) });
  }
}

