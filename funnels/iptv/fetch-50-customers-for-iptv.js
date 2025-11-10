/**
 * Fetch 50 customers from DASH-Base for IPTV offer
 */
import { Client } from '@notionhq/client';
import { writeFileSync } from 'fs';

const NOTION_TOKEN = process.env.NOTION_TOKEN; // Set via environment variable
const DASHBASE_ID = '186e7f645536804ab2bbe06861e4bf44';

async function fetch50Customers() {
  console.log('📊 Fetching 50 customers from DASH-Base for IPTV offer...\n');

  const notion = new Client({ auth: NOTION_TOKEN });

  try {
    // Query the DASH-Base database using search
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page'
      },
      page_size: 50,
      sort: {
        direction: 'ascending',
        timestamp: 'last_edited_time'
      }
    });

    // Filter for pages in our database
    const databasePages = response.results.filter(page =>
      page.parent?.database_id === DASHBASE_ID
    );

    console.log(`✅ Found ${databasePages.length} customers in DASH-Base\n`);

    // Extract customer data
    const customers = databasePages.map((page, index) => {
      const props = page.properties;

      return {
        id: index + 1,
        name: props['Customer Name']?.title?.[0]?.plain_text || 'N/A',
        whatsapp: props['WhatsApp']?.phone_number || props['Phone']?.phone_number || 'N/A',
        email: props['Email']?.email || 'N/A',
        renewalDate: props['Date de Renouvellement']?.date?.start || 'N/A',
        status: props['Statut']?.select?.name || 'N/A',
        plan: props['Plan']?.select?.name || 'N/A'
      };
    });

    // Save to file
    const output = {
      timestamp: new Date().toISOString(),
      totalCustomers: customers.length,
      purpose: 'IPTV Offer Campaign',
      customers: customers
    };

    writeFileSync(
      '/tmp/iptv-customer-list.json',
      JSON.stringify(output, null, 2)
    );

    console.log('💾 Saved to: /tmp/iptv-customer-list.json\n');

    // Display first 10 customers
    console.log('📋 First 10 customers:');
    console.log('='.repeat(80));
    customers.slice(0, 10).forEach(customer => {
      console.log(`${customer.id}. ${customer.name} - ${customer.whatsapp} - Status: ${customer.status}`);
    });
    console.log('='.repeat(80));

    console.log(`\n✅ Total: ${customers.length} customers ready for IPTV offer!`);

    return customers;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run it
fetch50Customers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
