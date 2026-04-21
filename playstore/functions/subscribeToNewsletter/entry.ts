import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, name, service = 'mailchimp' } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Save to database
    const subscriber = await base44.entities.EmailSubscriber.create({
      email,
      name: name || '',
      source: 'api',
      is_active: true,
    });

    // Send to email service
    let result = { success: true, subscriber_id: subscriber.id };

    if (service === 'mailchimp' && Deno.env.get('MAILCHIMP_API_KEY')) {
      const apiKey = Deno.env.get('MAILCHIMP_API_KEY');
      const serverPrefix = apiKey.split('-')[1];
      const listId = Deno.env.get('MAILCHIMP_LIST_ID') || '';

      const response = await fetch(`https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: { FNAME: name || '' },
        }),
      });

      const data = await response.json();
      result.mailchimp = { status: response.status, id: data.id };
    }

    if (service === 'sendgrid' && Deno.env.get('SENDGRID_API_KEY')) {
      const apiKey = Deno.env.get('SENDGRID_API_KEY');
      const contactListId = Deno.env.get('SENDGRID_CONTACT_LIST_ID') || '';

      const response = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: [
            {
              email,
              first_name: name || '',
            },
          ],
          list_ids: [contactListId],
        }),
      });

      result.sendgrid = { status: response.status };
    }

    return Response.json(result);
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});