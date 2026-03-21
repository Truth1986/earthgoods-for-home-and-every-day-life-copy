import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { limit = 9 } = await req.json().catch(() => ({}));

    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Instagram token not configured' }, { status: 400 });
    }

    // Get Instagram Business Account media
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${accessToken}&limit=${limit}`,
    );

    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch Instagram data' }, { status: 500 });
    }

    const data = await response.json();

    // Filter and format posts
    const posts = (data.data || [])
      .filter((post) => post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL')
      .map((post) => ({
        id: post.id,
        image: post.media_url,
        caption: post.caption || '',
        link: post.permalink,
        timestamp: post.timestamp,
      }));

    return Response.json({ posts, count: posts.length });
  } catch (error) {
    console.error('Instagram feed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});