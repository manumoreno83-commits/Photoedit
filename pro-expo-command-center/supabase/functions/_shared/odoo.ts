// Minimal XML-RPC client for Odoo (works on 14, 15, 16, 17).
// Auth uses an API Key (Odoo: My Profile → Account Security → New API Key).
// The key is read from Supabase secrets — NEVER hard-code it.

import { XMLParser } from 'npm:fast-xml-parser@^4.4.1';

const ODOO_URL = Deno.env.get('ODOO_URL') ?? '';
const ODOO_DB = Deno.env.get('ODOO_DB') ?? '';
const ODOO_LOGIN = Deno.env.get('ODOO_LOGIN') ?? '';
const ODOO_API_KEY = Deno.env.get('ODOO_API_KEY') ?? '';

if (!ODOO_URL || !ODOO_DB || !ODOO_LOGIN || !ODOO_API_KEY) {
  console.warn(
    '[odoo] Missing one of ODOO_URL / ODOO_DB / ODOO_LOGIN / ODOO_API_KEY. Set via `supabase secrets set`.',
  );
}

// XML encoding ------------------------------------------------------------

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function encodeValue(v: unknown): string {
  if (v === null || v === undefined) return '<value><nil/></value>';
  if (typeof v === 'boolean') return `<value><boolean>${v ? 1 : 0}</boolean></value>`;
  if (typeof v === 'number') {
    return Number.isInteger(v)
      ? `<value><int>${v}</int></value>`
      : `<value><double>${v}</double></value>`;
  }
  if (typeof v === 'string') return `<value><string>${escapeXml(v)}</string></value>`;
  if (Array.isArray(v)) {
    return `<value><array><data>${v.map(encodeValue).join('')}</data></array></value>`;
  }
  if (typeof v === 'object') {
    const members = Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `<member><name>${escapeXml(k)}</name>${encodeValue(val)}</member>`)
      .join('');
    return `<value><struct>${members}</struct></value>`;
  }
  throw new Error(`Cannot encode value of type ${typeof v}`);
}

function buildMethodCall(method: string, params: unknown[]): string {
  const body = params.map((p) => `<param>${encodeValue(p)}</param>`).join('');
  return `<?xml version="1.0"?>\n<methodCall><methodName>${method}</methodName><params>${body}</params></methodCall>`;
}

// XML decoding ------------------------------------------------------------

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false, // we coerce manually to avoid string→number surprises on IDs
  trimValues: true,
});

type XmlNode = Record<string, unknown> | string | undefined;

function decodeValue(node: XmlNode): unknown {
  if (node == null) return null;
  if (typeof node === 'string') return node;
  const n = node as Record<string, unknown>;
  if ('string' in n) return String(n.string ?? '');
  if ('int' in n) return Number(n.int);
  if ('i4' in n) return Number(n.i4);
  if ('double' in n) return Number(n.double);
  if ('boolean' in n) return n.boolean === '1' || n.boolean === 1;
  if ('nil' in n) return null;
  if ('dateTime.iso8601' in n) return String(n['dateTime.iso8601']);
  if ('array' in n) {
    const arr = n.array as Record<string, unknown>;
    const data = arr?.data as Record<string, unknown> | undefined;
    if (!data || data.value == null) return [];
    const v = data.value;
    const list = Array.isArray(v) ? v : [v];
    return list.map((x) => decodeValue(x as XmlNode));
  }
  if ('struct' in n) {
    const st = n.struct as Record<string, unknown>;
    if (!st.member) return {};
    const members = Array.isArray(st.member) ? st.member : [st.member];
    const obj: Record<string, unknown> = {};
    for (const m of members as Array<Record<string, unknown>>) {
      obj[String(m.name)] = decodeValue(m.value as XmlNode);
    }
    return obj;
  }
  return null;
}

interface MethodResponseFault {
  faultCode: number;
  faultString: string;
}

async function rpc<T = unknown>(endpoint: '/xmlrpc/2/common' | '/xmlrpc/2/object', method: string, params: unknown[]): Promise<T> {
  const url = `${ODOO_URL.replace(/\/$/, '')}${endpoint}`;
  const body = buildMethodCall(method, params);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'text/xml' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Odoo ${endpoint} HTTP ${res.status}: ${await res.text()}`);
  }

  const text = await res.text();
  const parsed = parser.parse(text) as Record<string, unknown>;
  const response = parsed.methodResponse as Record<string, unknown> | undefined;

  if (response?.fault) {
    const faultStruct = (response.fault as Record<string, unknown>).value as XmlNode;
    const fault = decodeValue(faultStruct) as MethodResponseFault;
    throw new Error(`Odoo fault ${fault.faultCode}: ${fault.faultString}`);
  }

  const params0 = (response?.params as Record<string, unknown> | undefined)?.param as
    | Record<string, unknown>
    | undefined;
  return decodeValue(params0?.value as XmlNode) as T;
}

// Public API --------------------------------------------------------------

let cachedUid: number | null = null;

export async function authenticate(): Promise<number> {
  if (cachedUid != null) return cachedUid;
  const uid = await rpc<number>('/xmlrpc/2/common', 'authenticate', [
    ODOO_DB,
    ODOO_LOGIN,
    ODOO_API_KEY,
    {},
  ]);
  if (!uid) throw new Error('Odoo authentication failed — check ODOO_LOGIN and ODOO_API_KEY');
  cachedUid = uid;
  return uid;
}

export interface SearchReadOptions {
  domain?: unknown[];
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
}

export async function searchRead<T = Record<string, unknown>>(
  model: string,
  opts: SearchReadOptions = {},
): Promise<T[]> {
  const uid = await authenticate();
  const args: unknown[] = [opts.domain ?? []];
  const kwargs: Record<string, unknown> = {
    fields: opts.fields ?? [],
    limit: opts.limit ?? 200,
    offset: opts.offset ?? 0,
  };
  if (opts.order) kwargs.order = opts.order;

  return rpc<T[]>('/xmlrpc/2/object', 'execute_kw', [
    ODOO_DB,
    uid,
    ODOO_API_KEY,
    model,
    'search_read',
    args,
    kwargs,
  ]);
}

export async function write(model: string, ids: number[], values: Record<string, unknown>) {
  const uid = await authenticate();
  return rpc<boolean>('/xmlrpc/2/object', 'execute_kw', [
    ODOO_DB,
    uid,
    ODOO_API_KEY,
    model,
    'write',
    [ids, values],
    {},
  ]);
}

export async function create(model: string, values: Record<string, unknown>) {
  const uid = await authenticate();
  return rpc<number>('/xmlrpc/2/object', 'execute_kw', [
    ODOO_DB,
    uid,
    ODOO_API_KEY,
    model,
    'create',
    [values],
    {},
  ]);
}

export const ODOO_CONFIG = { url: ODOO_URL, db: ODOO_DB, login: ODOO_LOGIN } as const;
