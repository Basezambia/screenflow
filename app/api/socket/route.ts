import { NextResponse } from 'next/server';

// For now, we'll return a simple response indicating that socket.io is not available
// In a production environment, you would set up a separate socket.io server
export async function GET() {
  return NextResponse.json({ 
    message: 'Socket.io server endpoint - would be implemented with a separate server in production',
    status: 'mock'
  });
}