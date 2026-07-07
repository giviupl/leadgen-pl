import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/jobs'];
const PROTECTED_API_PREFIXES = ['/api/jobs', '/api/job-offers'];

function isProtected(pathname: string): boolean {
  return [...PROTECTED_PREFIXES, ...PROTECTED_API_PREFIXES].some(prefix =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');
  const expectedUser = process.env.JOBS_AUTH_USER;
  const expectedPass = process.env.JOBS_AUTH_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return new NextResponse('Server misconfigured', { status: 500 });
  }

  if (authHeader?.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.slice(6));
      const [user, pass] = decoded.split(':');
      if (user === expectedUser && pass === expectedPass) {
        return NextResponse.next();
      }
    } catch {
      // ignore decode errors, fall through to 401
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="LeadGen Jobs"',
    },
  });
}

export const config = {
  matcher: ['/jobs/:path*', '/api/jobs/:path*', '/api/job-offers/:path*'],
};