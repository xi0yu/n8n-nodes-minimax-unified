import {
  NodeConnectionTypes,
  type IDataObject,
  type ILoadOptionsFunctions,
  type INodeListSearchResult,
  type INodeType,
  type INodeTypeDescription,
  type ISupplyDataFunctions,
  type SupplyData,
} from 'n8n-workflow';
import { isCodingPlan, resolveEndpoint } from './GenericFunctions';
import { DEFAULT_MODEL, MINIMAX_MODELS } from './models';

export class MiniMaxChatModel implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MiniMax Chat Model',
    name: 'miniMaxChatModel',
    icon: { light: 'file:minimax.svg', dark: 'file:minimax-dark.svg' },
    group: ['transform'],
    version: 1,
    description: 'MiniMax Chat Model for AI Agents and Chains (Intl + China, Standard + Coding Plan)',
    defaults: { name: 'MiniMax Chat Model' },
    codex: {
      categories: ['AI'],
      subcategories: {
        AI: ['Language Models', 'Root Nodes'],
        'Language Models': ['Chat Models (Recommended)'],
      },
      resources: {
        primaryDocumentation: [{ url: 'https://platform.minimaxi.com/document' }],
      },
    },
    inputs: [],
    outputs: [NodeConnectionTypes.AiLanguageModel],
    outputNames: ['Model'],
    credentials: [{ name: 'miniMaxApi', required: true }],
    properties: [
      {
        displayName: 'Model',
        name: 'model',
        type: 'resourceLocator',
        default: { mode: 'list', value: DEFAULT_MODEL },
        required: true,
        description: 'Pick a known model or paste any model ID supported by your MiniMax account',
        modes: [
          {
            displayName: 'From List',
            name: 'list',
            type: 'list',
            typeOptions: { searchable: true, searchListMethod: 'searchModels' },
          },
          {
            displayName: 'By Name',
            name: 'id',
            type: 'string',
            placeholder: 'e.g. MiniMax-M2.7 or abab6.5s-chat',
            validation: [
              {
                type: 'regex',
                properties: {
                  regex: '^[A-Za-z0-9._\\-:/]+$',
                  errorMessage: 'Model name contains invalid characters',
                },
              },
            ],
          },
        ],
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Temperature',
            name: 'temperature',
            type: 'number',
            default: 0.7,
            typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 1 },
            description: 'Controls randomness in the output',
          },
          {
            displayName: 'Max Tokens',
            name: 'maxTokens',
            type: 'number',
            default: 2048,
            typeOptions: { minValue: 1, maxValue: 204800 },
            description: 'Maximum number of tokens to generate',
          },
          {
            displayName: 'Top P',
            name: 'topP',
            type: 'number',
            default: 0.95,
            typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 },
            description: 'Nucleus sampling parameter',
          },
        ],
      },
    ],
  };

  methods = {
    listSearch: {
      async searchModels(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
        const q = (filter ?? '').toLowerCase();
        const results = MINIMAX_MODELS
          .filter((m) => !q || m.name.toLowerCase().includes(q) || m.value.toLowerCase().includes(q))
          .map((m) => ({ name: m.name, value: m.value }));
        return { results };
      },
    },
  };

  async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
    const credentials = (await this.getCredentials('miniMaxApi')) as IDataObject;
    const modelRaw = this.getNodeParameter('model', itemIndex) as string | { mode: string; value: string };
    const modelName = typeof modelRaw === 'string' ? modelRaw : String(modelRaw.value ?? '');
    const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

    const temperature = (options.temperature as number | undefined) ?? 0.7;
    const maxTokens = (options.maxTokens as number | undefined) ?? 2048;
    const topP = (options.topP as number | undefined) ?? 0.95;

    const rawKey = String(credentials.apiKey ?? '').trim();
    const apiKey = rawKey.toLowerCase().startsWith('bearer ') ? rawKey.slice(7).trim() : rawKey;
    const ep = resolveEndpoint(credentials);

    if (isCodingPlan(credentials)) {
      const { ChatAnthropic } = await import('@langchain/anthropic');
      const model = new ChatAnthropic({
        anthropicApiKey: apiKey,
        model: modelName,
        temperature,
        maxTokens,
        topP,
        clientOptions: { baseURL: ep.anthropicBase },
      });
      return { response: model };
    }

    const { ChatOpenAI } = await import('@langchain/openai');
    const model = new ChatOpenAI({
      apiKey,
      model: modelName,
      temperature,
      maxTokens,
      topP,
      configuration: { baseURL: ep.openaiBase },
    });
    return { response: model };
  }
}
