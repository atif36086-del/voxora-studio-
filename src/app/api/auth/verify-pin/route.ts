import { NextRequest, NextResponse } from 'next/server';

const CORRECT_PIN = process.env.APP_PIN || '8369';
const AUTH_COOKIE_NAME = 'voxora_auth_token';
const AUTH_COOKIE_VALUE = 'voxora_authenticated_8369';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pin } = body;

    if (!pin || String(pin).trim() !== String(CORRECT_PIN).trim()) {
      return NextResponse.json(
        { success: false, error: 'Incorrect PIN. Access Denied.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Access granted',
    });

    // Set auth cookie for 365 days (1 year)
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: AUTH_COOKIE_VALUE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token === AUTH_COOKIE_VALUE) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
