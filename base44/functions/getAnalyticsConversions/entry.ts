import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // First, list GA4 properties the user has access to
    const propsRes = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/-',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!propsRes.ok) {
      const err = await propsRes.text();
      console.error('GA Admin API error:', err);
      return Response.json({ error: 'Failed to list GA properties', details: err }, { status: 502 });
    }

    const propsData = await propsRes.json();
    const properties = propsData.properties || [];

    if (properties.length === 0) {
      return Response.json({ error: 'No GA4 properties found. Make sure Google Analytics is set up.' }, { status: 404 });
    }

    // Use the first property
    const propertyId = properties[0].name; // e.g. "properties/123456789"

    // Query GA4 Data API for sessions and conversions by session source/medium
    // comparing newsletter/email referrals vs other sources over last 30 days
    const reportRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' },
            { name: 'totalRevenue' },
            { name: 'bounceRate' },
          ],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 20,
        }),
      }
    );

    if (!reportRes.ok) {
      const err = await reportRes.text();
      console.error('GA Data API error:', err);
      return Response.json({ error: 'Failed to fetch analytics report', details: err }, { status: 502 });
    }

    const report = await reportRes.json();
    const rows = (report.rows || []).map(row => ({
      source: row.dimensionValues[0].value,
      medium: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value || '0'),
      conversions: parseInt(row.metricValues[1].value || '0'),
      revenue: parseFloat(row.metricValues[2].value || '0'),
      bounceRate: parseFloat(row.metricValues[3].value || '0'),
    }));

    return Response.json({
      propertyId,
      propertyName: properties[0].displayName,
      rows,
    });
  } catch (error) {
    console.error('Error in getAnalyticsConversions:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});