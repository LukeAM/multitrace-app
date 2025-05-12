import { NextRequest } from 'next/server';
import formidable, { Fields, Files, File } from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest): Promise<Response> {
  // Parse the form data
  const form = new formidable.IncomingForm();
  // formidable expects a Node.js IncomingMessage, so we need to get the raw req
  // @ts-ignore
  return new Promise<Response>((resolve) => {
    form.parse(req as any, async (err: Error | null, fields: Fields, files: Files) => {
      if (err) {
        resolve(
          new Response(JSON.stringify({ error: 'Error parsing form data' }), { status: 500 })
        );
        return;
      }
      let file = files.file as File | File[] | undefined;
      if (!file) {
        resolve(
          new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 })
        );
        return;
      }
      if (Array.isArray(file)) {
        file = file[0];
      }
      try {
        const fileStream = fs.createReadStream(file.filepath);
        const response = await openai.audio.transcriptions.create({
          file: fileStream,
          model: 'whisper-1',
          response_format: 'json',
          language: 'en',
        });
        resolve(
          new Response(JSON.stringify({ text: response.text }), { status: 200 })
        );
      } catch (e: any) {
        resolve(
          new Response(JSON.stringify({ error: e.message || 'Whisper transcription failed' }), { status: 500 })
        );
      }
    });
  });
}