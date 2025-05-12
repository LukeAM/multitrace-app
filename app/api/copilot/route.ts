import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { prompt, context } = await req.json();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: false, // you can toggle this if you re-enable streaming properly later
    messages: [
      {
        role: 'system',
        content: 'You are a helpful sales copilot embedded inside a sales IDE.',
      },
      {
        role: 'user',
        content: `${prompt}\n\nContext:\n${context}`,
      },
    ],
  });

  return new Response(JSON.stringify({ response: completion.choices[0].message.content }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
