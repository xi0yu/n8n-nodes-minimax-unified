import type { INodeProperties } from 'n8n-workflow';
import { configureRequest, sendErrorPostReceive, simplifyOutputPostReceive } from './GenericFunctions';
import { DEFAULT_MODEL, MINIMAX_MODELS } from './models';

export const chatOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['chat'] } },
    options: [
      {
        name: 'Complete',
        value: 'complete',
        action: 'Create chat completion',
        description: 'Creates a model response for the given chat conversation',
        routing: {
          request: { method: 'POST', url: '/v1/text/chatcompletion_v2' },
          send: { preSend: [configureRequest] },
          output: { postReceive: [sendErrorPostReceive] },
        },
      },
    ],
    default: 'complete',
  },
];

const completeOperations: INodeProperties[] = [
  {
    displayName: 'Model',
    name: 'model',
    type: 'resourceLocator',
    default: { mode: 'list', value: DEFAULT_MODEL },
    required: true,
    description:
      'Pick a known model or paste any model ID supported by your MiniMax account',
    displayOptions: { show: { resource: ['chat'] } },
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        typeOptions: {
          searchable: true,
          searchListMethod: 'searchModels',
        },
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
    displayName: 'Prompt',
    name: 'prompt',
    type: 'fixedCollection',
    typeOptions: { sortable: true, multipleValues: true },
    displayOptions: { show: { resource: ['chat'] } },
    placeholder: 'Add Message',
    default: {},
    options: [
      {
        displayName: 'Messages',
        name: 'messages',
        values: [
          {
            displayName: 'Role',
            name: 'role',
            type: 'options',
            options: [
              { name: 'System', value: 'system' },
              { name: 'User', value: 'user' },
              { name: 'Assistant', value: 'assistant' },
            ],
            default: 'user',
          },
          {
            displayName: 'Content',
            name: 'content',
            type: 'string',
            typeOptions: { rows: 4 },
            default: '',
          },
        ],
      },
    ],
    routing: {
      send: { type: 'body', property: 'messages', value: '={{ $value.messages }}' },
    },
  },
];

const sharedOperations: INodeProperties[] = [
  {
    displayName: 'Simplify',
    name: 'simplifyOutput',
    type: 'boolean',
    default: true,
    displayOptions: { show: { resource: ['chat'] } },
    routing: { output: { postReceive: [simplifyOutputPostReceive] } },
    description: 'Whether to return a simplified version of the response instead of the raw data',
  },
  {
    displayName: 'Options',
    name: 'options',
    placeholder: 'Add Option',
    description: 'Additional options to add',
    type: 'collection',
    default: {},
    displayOptions: { show: { resource: ['chat'] } },
    options: [
      {
        displayName: 'Frequency Penalty',
        name: 'frequency_penalty',
        default: 0,
        typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
        description: 'Standard API only — ignored for Coding Plan',
        type: 'number',
        routing: { send: { type: 'body', property: 'frequency_penalty' } },
      },
      {
        displayName: 'Maximum Number of Tokens',
        name: 'maxTokens',
        default: 2048,
        description: 'The maximum number of tokens to generate in the completion',
        type: 'number',
        typeOptions: { maxValue: 204800, minValue: 1 },
        routing: { send: { type: 'body', property: 'max_tokens' } },
      },
      {
        displayName: 'Presence Penalty',
        name: 'presence_penalty',
        default: 0,
        typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
        description: 'Standard API only — ignored for Coding Plan',
        type: 'number',
        routing: { send: { type: 'body', property: 'presence_penalty' } },
      },
      {
        displayName: 'Response Format',
        name: 'response_format',
        type: 'options',
        options: [
          { name: 'Text', value: 'text' },
          { name: 'JSON Object', value: 'json_object' },
        ],
        default: 'text',
        description: 'Standard API only — ignored for Coding Plan',
        routing: {
          send: { type: 'body', property: 'response_format', value: '={{ { "type": $value } }}' },
        },
      },
      {
        displayName: 'Sampling Temperature',
        name: 'temperature',
        default: 0.7,
        typeOptions: { maxValue: 2, minValue: 0, numberPrecision: 1 },
        description: 'Lower = more deterministic',
        type: 'number',
        routing: { send: { type: 'body', property: 'temperature' } },
      },
      {
        displayName: 'Top P',
        name: 'topP',
        default: 0.95,
        typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 2 },
        description: 'Nucleus sampling',
        type: 'number',
        routing: { send: { type: 'body', property: 'top_p' } },
      },
    ],
  },
];

export const chatFields: INodeProperties[] = [...completeOperations, ...sharedOperations];
export { MINIMAX_MODELS };
