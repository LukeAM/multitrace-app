import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // This will try to get the session from any available source
    const { userId, sessionId } = auth();
    
    // If we have a session, return success
    if (userId && sessionId) {
      return NextResponse.json({
        authenticated: true,
        userId,
        sessionId
      });
    }
    
    // Check if there's a session token in the URL (from redirect)
    const searchParams = request.nextUrl.searchParams;
    const sessionToken = searchParams.get('__clerk_session');
    
    if (sessionToken) {
      // Try to establish session with the token
      const response = NextResponse.json({
        authenticated: false,
        message: 'Session token found, please refresh'
      });
      
      // Set the session cookie
      response.cookies.set('__session', sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      
      return response;
    }
    
    return NextResponse.json({
      authenticated: false,
      message: 'No session found'
    });
    
  } catch (error) {
    console.error('Session sync error:', error);
    return NextResponse.json({
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 