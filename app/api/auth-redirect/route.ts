import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('__clerk_db_jwt');
  const redirectUrl = searchParams.get('redirect') || '/';
  
  if (!token) {
    console.log('No token provided in auth-redirect');
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  // Create a response that redirects to the accounts domain
  const response = NextResponse.redirect(new URL(redirectUrl, 'https://accounts.multitrace.ai'));
  
  // Set cookies that will be needed for authentication
  // The cookie should be accessible on the accounts.multitrace.ai domain
  response.cookies.set('__clerk_db_jwt', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    domain: '.multitrace.ai' // Base domain to share across subdomains
  });
  
  console.log('Auth redirect successful, token transferred');
  
  return response;
} 