import { NextRequest, NextResponse } from 'next/server';

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const BYPASS_SECRET = process.env.MAINTENANCE_BYPASS_SECRET || '';

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)
  );
}

function hasValidBypass(request: NextRequest) {
  if (!BYPASS_SECRET) return false;
  return request.cookies.get('maintenance_bypass')?.value === BYPASS_SECRET;
}

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  const { pathname, searchParams } = request.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (pathname === '/maintenance') {
    return NextResponse.next();
  }

  const bypassToken = searchParams.get('bypass');
  if (BYPASS_SECRET && bypassToken === BYPASS_SECRET) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('bypass');
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set('maintenance_bypass', BYPASS_SECRET, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  }

  if (hasValidBypass(request)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Store is under maintenance' },
      { status: 503 }
    );
  }

  const maintenanceUrl = request.nextUrl.clone();
  maintenanceUrl.pathname = '/maintenance';
  maintenanceUrl.search = '';
  return NextResponse.redirect(maintenanceUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
