import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { note, user_id } = body;

    if (!note || !note.trim()) {
      return NextResponse.json({ success: false, error: 'Note text is required' }, { status: 400 });
    }

    const newNote = await dbStore.addCaseNote(id, note.trim(), user_id);
    return NextResponse.json({ success: true, note: newNote }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
