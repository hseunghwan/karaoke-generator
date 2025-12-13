import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Mock Authentication Logic
  // In reality, verify credentials with DB or Auth Provider

  const body = await request.json();
  const { username, password } = body;

  if (username === 'admin' && password === 'admin') {
    // Set HttpOnly Cookie
    const response = NextResponse.json({ success: true, user: { name: 'Admin User' } });
    response.cookies.set('auth-token', 'mock-jwt-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  }

  return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
}
