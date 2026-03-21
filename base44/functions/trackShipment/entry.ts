import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tracking_number, carrier } = await req.json();

    if (!tracking_number || !carrier) {
      return Response.json({ error: 'Tracking number and carrier required' }, { status: 400 });
    }

    let trackingData = null;

    // USPS Tracking
    if (carrier.toLowerCase() === 'usps') {
      const uspsKey = Deno.env.get('USPS_API_KEY');
      if (uspsKey) {
        try {
          const response = await fetch('https://secure.shippingapis.com/ShippingAPI.dll', {
            method: 'POST',
            body: `API=TrackV2&XML=<TrackRequest USERID="${uspsKey}"><TrackID ID="${tracking_number}"></TrackID></TrackRequest>`,
          });
          const text = await response.text();
          trackingData = { carrier: 'USPS', raw: text };
        } catch (e) {
          console.error('USPS tracking error:', e);
        }
      }
    }

    // UPS Tracking
    if (carrier.toLowerCase() === 'ups') {
      const upsKey = Deno.env.get('UPS_API_KEY');
      if (upsKey) {
        try {
          const response = await fetch(`https://onlinetools.ups.com/track/v1/details/${tracking_number}`, {
            headers: {
              'ApiKey': upsKey,
              'Accept': 'application/json',
            },
          });
          const data = await response.json();
          trackingData = { carrier: 'UPS', status: data.trackResponse?.shipment?.[0]?.package?.[0]?.activity };
        } catch (e) {
          console.error('UPS tracking error:', e);
        }
      }
    }

    // FedEx Tracking
    if (carrier.toLowerCase() === 'fedex') {
      const fedexKey = Deno.env.get('FEDEX_API_KEY');
      if (fedexKey) {
        try {
          const response = await fetch('https://apis.fedex.com/track/v1/tracknumbers', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${fedexKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              trackingInfo: [
                {
                  trackingNumberInfo: {
                    trackingNumber: tracking_number,
                  },
                },
              ],
            }),
          });
          const data = await response.json();
          trackingData = { carrier: 'FedEx', completeTrackResults: data.completeTrackResults?.[0] };
        } catch (e) {
          console.error('FedEx tracking error:', e);
        }
      }
    }

    return Response.json({
      tracking_number,
      carrier,
      data: trackingData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Shipment tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});