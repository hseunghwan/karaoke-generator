import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1'; // FastAPI prefix

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const query = request.nextUrl.search;
  const targetUrl = `${BACKEND_URL}${API_PREFIX}/${path}${query}`;

  console.log(`Proxying request to: ${targetUrl}`);

  try {
    const body = request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : null;

    const headers = new Headers(request.headers);
    // Remove host header to avoid confusion
    headers.delete('host');
    headers.delete('connection');

    // Add internal secret if needed
    // headers.set('X-Internal-Secret', process.env.INTERNAL_SECRET);

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      // @ts-ignore
      duplex: 'half' // Required for streaming bodies in some node versions
    });

    const data = await response.blob();

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json({ error: 'Backend is unreachable' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
