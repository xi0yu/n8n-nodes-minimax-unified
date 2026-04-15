import type {
  IExecuteSingleFunctions,
  IHttpRequestOptions,
  IN8nHttpFullResponse,
  INodeExecutionData,
  IDataObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export type Region = 'intl' | 'cn' | 'custom';
export type Flavor = 'standard' | 'codingPlan';

export interface Endpoint {
  baseURL: string;
  chatPath: string;
  openaiBase: string;
  anthropicPath: string;
  anthropicBase: string;
}

const INTL = 'https://api.minimax.io';
const CN = 'https://api.minimaxi.com';

export function getRegion(raw: unknown): Region {
  if (raw === 'cn' || raw === 'intl' || raw === 'custom') return raw;
  // back-compat with old apiType field
  if (raw === 'cnStandard' || raw === 'cnCodingPlan') return 'cn';
  if (raw === 'intlStandard' || raw === 'intlCodingPlan') return 'intl';
  return 'intl';
}

export function getFlavor(credentials: IDataObject): Flavor {
  const f = credentials.flavor ?? credentials.customFlavor;
  if (f === 'codingPlan' || f === 'standard') return f;
  // back-compat with old apiType field
  if (credentials.apiType === 'intlCodingPlan' || credentials.apiType === 'cnCodingPlan') {
    return 'codingPlan';
  }
  return 'standard';
}

export function resolveEndpoint(credentials: IDataObject): Endpoint {
  const region = getRegion(credentials.region ?? credentials.apiType);
  let base: string;
  if (region === 'cn') base = CN;
  else if (region === 'custom') base = String(credentials.customBaseUrl || CN).replace(/\/+$/, '');
  else base = INTL;
  return {
    baseURL: base,
    chatPath: '/v1/text/chatcompletion_v2',
    openaiBase: `${base}/v1`,
    anthropicPath: '/anthropic/v1/messages',
    anthropicBase: `${base}/anthropic`,
  };
}

export function isCodingPlan(credentials: IDataObject): boolean {
  return getFlavor(credentials) === 'codingPlan';
}

export async function sendErrorPostReceive(
  this: IExecuteSingleFunctions,
  data: INodeExecutionData[],
  response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
  const code = String(response.statusCode);
  if (code.startsWith('4') || code.startsWith('5')) {
    throw new NodeApiError(this.getNode(), response as unknown as Record<string, unknown> as never);
  }
  return data;
}

function resolveModelParam(this: IExecuteSingleFunctions): string {
  const raw = this.getNodeParameter('model') as string | { mode: string; value: string };
  if (typeof raw === 'string') return raw;
  return String((raw as { value: string }).value ?? '');
}

export async function configureRequest(
  this: IExecuteSingleFunctions,
  requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
  const credentials = (await this.getCredentials('miniMaxApi')) as IDataObject;
  const ep = resolveEndpoint(credentials);
  const coding = isCodingPlan(credentials);

  const body = (requestOptions.body ?? {}) as IDataObject;
  // resourceLocator → flat string
  const modelValue = resolveModelParam.call(this);
  if (modelValue) body.model = modelValue;

  if (coding) {
    requestOptions.baseURL = ep.baseURL;
    requestOptions.url = ep.anthropicPath;
    const messages = ((body.messages ?? []) as Array<{ role: string; content: string }>);
    const systemParts = messages.filter((m) => m.role === 'system').map((m) => m.content);
    const nonSystem = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));
    const anthropicBody: IDataObject = {
      model: body.model,
      max_tokens: body.max_tokens || 1024,
      messages: nonSystem,
    };
    if (systemParts.length) anthropicBody.system = systemParts.join('\n');
    if (body.temperature !== undefined) anthropicBody.temperature = body.temperature;
    if (body.top_p !== undefined) anthropicBody.top_p = body.top_p;
    requestOptions.body = anthropicBody;
    delete requestOptions.qs;
  } else {
    requestOptions.baseURL = ep.baseURL;
    requestOptions.url = ep.chatPath;
    requestOptions.body = body;
    if (credentials.groupId) {
      requestOptions.qs = requestOptions.qs || {};
      (requestOptions.qs as IDataObject).GroupId = credentials.groupId;
    }
  }
  return requestOptions;
}

export async function simplifyOutputPostReceive(
  this: IExecuteSingleFunctions,
  items: INodeExecutionData[],
  response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
  const simplify = this.getNodeParameter('simplifyOutput') as boolean;
  if (!simplify) return items;

  const credentials = (await this.getCredentials('miniMaxApi')) as IDataObject;
  const body = (response.body ?? {}) as IDataObject;

  if (isCodingPlan(credentials)) {
    const content = ((body.content ?? []) as Array<{ type: string; text?: string; thinking?: string }>);
    const text = content.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
    const thinking = content.filter((c) => c.type === 'thinking').map((c) => c.thinking ?? '').join('\n');
    const result: IDataObject = { message: { role: 'assistant', content: text } };
    if (thinking) result.thinking = thinking;
    return [{ json: result }];
  }

  const choices = ((body.choices ?? []) as Array<{ message: IDataObject }>);
  return choices.map((c) => ({ json: { message: c.message } }));
}
