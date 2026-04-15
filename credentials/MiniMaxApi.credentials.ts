import type {
  IAuthenticate,
  ICredentialDataDecryptedObject,
  ICredentialTestRequest,
  ICredentialType,
  IHttpRequestOptions,
  INodeProperties,
} from 'n8n-workflow';

export class MiniMaxApi implements ICredentialType {
  name = 'miniMaxApi';
  displayName = 'MiniMax API';
  documentationUrl = 'https://platform.minimaxi.com/document';
  icon = { light: 'file:minimax.svg', dark: 'file:minimax-dark.svg' } as const;

  properties: INodeProperties[] = [
    {
      displayName: 'Region',
      name: 'region',
      type: 'options',
      options: [
        { name: 'International (api.minimax.io)', value: 'intl' },
        { name: 'China (api.minimaxi.com)', value: 'cn' },
        { name: 'Custom Base URL', value: 'custom' },
      ],
      default: 'intl',
      description:
        'International uses api.minimax.io; China uses api.minimaxi.com. Pick the one matching where your API Key was issued.',
    },
    {
      displayName: 'Custom Base URL',
      name: 'customBaseUrl',
      type: 'string',
      default: 'https://api.minimaxi.com',
      placeholder: 'https://api.minimaxi.com',
      description: 'Base URL without trailing slash. Used only when Region = Custom.',
      displayOptions: { show: { region: ['custom'] } },
    },
    {
      displayName: 'Plan / Flavor',
      name: 'flavor',
      type: 'options',
      options: [
        {
          name: 'Standard (Pay-as-you-go, OpenAI-compatible)',
          value: 'standard',
        },
        {
          name: 'Coding Plan (Subscription, Anthropic-compatible)',
          value: 'codingPlan',
        },
      ],
      default: 'standard',
      description: 'Standard keys and Coding Plan keys are NOT interchangeable.',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      required: true,
      default: '',
      description: 'Paste the API Key only (no "Bearer " prefix — it is added automatically)',
    },
    {
      displayName: 'Group ID',
      name: 'groupId',
      type: 'string',
      default: '',
      description:
        'MiniMax Group ID from the console (optional, only used as GroupId query param on Standard endpoints)',
      displayOptions: { show: { flavor: ['standard'] } },
    },
  ];

  authenticate: IAuthenticate = async (
    credentials: ICredentialDataDecryptedObject,
    requestOptions: IHttpRequestOptions,
  ): Promise<IHttpRequestOptions> => {
    requestOptions.headers = requestOptions.headers ?? {};
    const raw = String(credentials.apiKey ?? '').trim();
    const token = raw.toLowerCase().startsWith('bearer ') ? raw.slice(7).trim() : raw;
    requestOptions.headers['Authorization'] = `Bearer ${token}`;
    return requestOptions;
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL:
        '={{ $credentials.region === "cn" ? "https://api.minimaxi.com" : ($credentials.region === "custom" ? $credentials.customBaseUrl : "https://api.minimax.io") }}',
      url:
        '={{ $credentials.flavor === "codingPlan" ? "/anthropic/v1/messages" : "/v1/text/chatcompletion_v2" }}',
      method: 'POST',
      body: {
        model: 'MiniMax-M2.5',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      },
      headers: { 'Content-Type': 'application/json' },
      ignoreHttpStatusErrors: true,
    },
  };
}
