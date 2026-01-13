import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
    : undefined;

if (!SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error('Missing Google Sheets configuration. Please check your environment variables.');
}

const serviceAccountAuth = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const getDoc = async () => {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID!, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
};

export const getSheetByName = async (name: string) => {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle[name];
    if (!sheet) {
        throw new Error(`Sheet "${name}" not found. Please create it first.`);
    }
    return sheet;
};

// Helper to convert rows to objects
export const rowsToObjects = <T>(rows: any[]): T[] => {
    return rows.map(row => {
        const obj: any = {};
        // Google Spreadsheet rows have values in their header names
        // We can access them via _rawData if needed but usually row.toObject() works or direct access
        return row.toObject();
    });
};

export const CUSTOMERS_SHEET = 'Customers';
export const REQUESTS_SHEET = 'Requests';
export const INVOICES_SHEET = 'Invoices';

// Interface definitions
export interface Customer {
    id: string;
    companyName: string;
    taxId?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
}

export interface QuotationRequest {
    id: string;
    quotationDate: string;
    customerName: string;
    customerTaxId?: string;
    customerAddress?: string;
    salesName: string;
    items: any; // Can be string in sheet, but object in app
    itemsRaw?: string; // Column for warranty display in Sheet
    itemsJson?: string; // Hidden JSON data for system
    paymentTerm: 'เงินสด' | 'เครดิต 15 วัน' | 'เครดิต 30 วัน' | 'เครดิต 60 วัน';
    subtotal: number;
    vatAmount: number;
    totalAmount: number;
    requestType: 'ใบเสนอราคา' | 'ใบเสร็จ';
    note?: string;
    status: 'รออนุมัติ' | 'รอหลังบ้านตรวจสอบ' | 'รับเรื่องแล้ว' | 'เปิดใบเสนอราคา' | 'เปิดบิล' | 'ไม่อนุมัติ' | 'ถูกปฏิเสธ';
    createdAt: string;
    updatedAt: string;
    // Joined data (not in sheet)
    invoiceNo?: string;
    invoiceDate?: string;
    quotationFile?: string;
}

export interface InvoiceRecord {
    id: string;
    quotationRequestId: string;
    invoiceNo: string;
    invoiceDate: string;
    deliveryDate?: string;
    vatAmount?: number;
    createdAt: string;
    updatedAt: string;
}

// Data fetching helpers
export const getAllData = async <T>(sheetName: string): Promise<T[]> => {
    const sheet = await getSheetByName(sheetName);
    const rows = await sheet.getRows();
    return rows.map((row: any) => row.toObject()) as T[];
};

export const addRow = async (sheetName: string, data: any) => {
    const sheet = await getSheetByName(sheetName);
    return await sheet.addRow(data);
};

export const updateRowByValue = async (sheetName: string, key: string, value: string, data: any) => {
    const sheet = await getSheetByName(sheetName);
    const rows = await sheet.getRows();
    const row = rows.find((r: any) => r.get(key) === value);
    if (row) {
        Object.keys(data).forEach(k => {
            row.set(k, data[k]);
        });
        await row.save();
        return row;
    }
    return null;
};
