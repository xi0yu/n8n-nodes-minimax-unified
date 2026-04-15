import type {
  ILoadOptionsFunctions,
  INodeListSearchResult,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { chatFields, chatOperations } from './ChatDescription';
import { MINIMAX_MODELS } from './models';

export class MiniMax implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MiniMax',
    name: 'miniMax',
    icon: { light: 'file:minimax.svg', dark: 'file:minimax-dark.svg' },
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Consume MiniMax AI API (Intl + China, Standard + Coding Plan)',
    defaults: { name: 'MiniMax' },
    inputs: ['main'] as unknown as INodeTypeDescription['inputs'],
    outputs: ['main'] as unknown as INodeTypeDescription['outputs'],
    credentials: [{ name: 'miniMaxApi', required: true }],
    requestDefaults: {
      ignoreHttpStatusErrors: true,
      baseURL: 'https://api.minimaxi.com',
    },
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [{ name: 'Chat', value: 'chat' }],
        default: 'chat',
      },
      ...chatOperations,
      ...chatFields,
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
}
