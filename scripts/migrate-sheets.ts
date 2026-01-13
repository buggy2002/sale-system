import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import * as dotenv from 'dotenv';
import {
    CUSTOMERS_SHEET,
    REQUESTS_SHEET,
    INVOICES_SHEET
} from '../src/lib/google-sheets';

dotenv.config({ path: '.env.local' });

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
    : undefined;

if (!SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error('❌ Missing environment variables in .env.local');
    process.exit(1);
}

const serviceAccountAuth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEETS_CONFIG = [
    {
        name: CUSTOMERS_SHEET,
        headers: ['id', 'companyName', 'taxId', 'address', 'createdAt', 'updatedAt']
    },
    {
        name: REQUESTS_SHEET,
        headers: [
            'id',
            'quotationDate',
            'customerName',
            'customerTaxId',
            'customerAddress',
            'salesName',
            'items',
            'itemsRaw',
            'itemsJson',
            'paymentTerm',
            'subtotal',
            'vatAmount',
            'totalAmount',
            'requestType',
            'note',
            'status',
            'quotationFile',
            'createdAt',
            'updatedAt'
        ]
    },
    {
        name: INVOICES_SHEET,
        headers: ['id', 'quotationRequestId', 'invoiceNo', 'invoiceDate', 'deliveryDate', 'vatAmount', 'createdAt', 'updatedAt']
    }
];

async function migrate() {
    console.log('🚀 Starting Google Sheets migration...');

    try {
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID!, serviceAccountAuth);
        await doc.loadInfo();
        console.log(`📂 Linked to Spreadsheet: ${doc.title}`);

        for (const config of SHEETS_CONFIG) {
            let sheet = doc.sheetsByTitle[config.name];

            if (!sheet) {
                console.log(`➕ Creating sheet: ${config.name}...`);
                sheet = await doc.addSheet({ title: config.name, headerValues: config.headers });
                console.log(`✅ Created ${config.name}`);
            } else {
                console.log(`ℹ️ Sheet "${config.name}" already exists. Checking headers...`);
                // Check and update headers if necessary
                await sheet.loadHeaderRow();
                const existingHeaders = sheet.headerValues;

                // If headers are different, update them
                if (JSON.stringify(existingHeaders) !== JSON.stringify(config.headers)) {
                    console.log(`⚠️ Headers for "${config.name}" are outdated. Updating...`);
                    await sheet.setHeaderRow(config.headers);
                    console.log(`✅ Updated headers for ${config.name}`);
                } else {
                    console.log(`✅ Headers for "${config.name}" are correct.`);
                }
            }
        }

        console.log('\n✨ Migration completed successfully! Your Google Sheet is ready.');
    } catch (error: any) {
        console.error('\n❌ Migration failed:');
        if (error.response?.status === 404) {
            console.error('👉 Error: Spreadsheet not found (404).');
            console.error('👉 Please double-check your GOOGLE_SHEET_ID in .env.local');
        } else if (error.response?.status === 403) {
            console.error('👉 Error: Permission denied (403).');
            console.error('👉 Please make sure you have shared the Google Sheet with the Service Account email:');
            console.error(`   ${GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
        } else if (error.message.includes('ERR_OSSL_UNSUPPORTED') || error.message.includes('unsupported')) {
            console.error('👉 Error: Invalid GOOGLE_PRIVATE_KEY format.');
            console.error('👉 Tip: Make sure the key in .env.local starts with "-----BEGIN PRIVATE KEY-----" and ends with "\\n" at the end of each line or is wrapped in quotes.');
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

migrate();
