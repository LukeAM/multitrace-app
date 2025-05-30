import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt, context, apiKey, apiUrl } = await req.json();

  if (!apiKey || !apiUrl) {
    return new Response(
      JSON.stringify({ error: 'API key and URL are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Make request to the custom API endpoint
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        context,
        // You can include additional parameters here based on your API's requirements
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ 
          error: 'Error calling custom API', 
          details: errorData 
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ response: data.response || data.message || data.content || data }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Custom API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to call custom API', 
        details: error instanceof Error ? error.message : String(error) 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 