import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('id');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });
  }

  try {
    const metaRes = await fetch(`https://api.scratch.mit.edu/projects/${projectId}`);
    if (!metaRes.ok) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const meta = await metaRes.json();
    const token = meta.project_token;

    const projectRes = await fetch(`https://projects.scratch.mit.edu/${projectId}?token=${token}`);
    if (!projectRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch project JSON' }, { status: 500 });
    }

    const projectData = await projectRes.json();
    return NextResponse.json(projectData);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
