import type { NextRequest } from 'next/server';
import { ChatSDKError } from '@/lib/errors';
import { getHistories } from '@/services/chat';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  const chats = await getHistories({
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}
