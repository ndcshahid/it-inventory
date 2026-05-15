import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

const VALID_STATUSES = ['AVAILABLE', 'ISSUED', 'TRANSFERRED', 'UNDER_REPAIR', 'DAMAGED', 'LOST', 'RETIRED'];
const VALID_CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'POOR'];

function parseDate(val: any): Date | null {
  if (!val) return null;
  // Excel serial number
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) return new Date(date.y, date.m - 1, date.d);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'IT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    // Pre-load all categories and locations for name → id lookup
    const [categories, locations] = await Promise.all([
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.location.findMany({ select: { id: true, name: true } }),
    ]);
    const catMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
    const locMap = new Map(locations.map(l => [l.name.toLowerCase(), l.id]));

    const errors: string[] = [];
    const toInsert: any[] = [];
    const seenTags = new Set<string>();
    const seenSerials = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-indexed + header row
      const name = String(row['assetName'] || row['Asset Name'] || '').trim();
      const tag = String(row['assetTag'] || row['Asset Tag'] || '').trim();
      const serial = String(row['serialNumber'] || row['Serial Number'] || '').trim();

      if (!name) { errors.push(`Row ${rowNum}: assetName is required`); continue; }
      if (!tag)  { errors.push(`Row ${rowNum}: assetTag is required`);  continue; }
      if (!serial) { errors.push(`Row ${rowNum}: serialNumber is required`); continue; }

      if (seenTags.has(tag))   { errors.push(`Row ${rowNum}: duplicate assetTag "${tag}" in file`); continue; }
      if (seenSerials.has(serial)) { errors.push(`Row ${rowNum}: duplicate serialNumber "${serial}" in file`); continue; }
      seenTags.add(tag);
      seenSerials.add(serial);

      const conditionRaw = String(row['condition'] || row['Condition'] || 'GOOD').trim().toUpperCase();
      const statusRaw = String(row['status'] || row['Status'] || 'AVAILABLE').trim().toUpperCase();

      if (!VALID_CONDITIONS.includes(conditionRaw)) {
        errors.push(`Row ${rowNum}: invalid condition "${conditionRaw}" (use NEW/GOOD/FAIR/POOR)`);
        continue;
      }
      if (!VALID_STATUSES.includes(statusRaw)) {
        errors.push(`Row ${rowNum}: invalid status "${statusRaw}"`);
        continue;
      }

      const categoryName = String(row['categoryName'] || row['Category'] || '').trim().toLowerCase();
      const locationName = String(row['locationName'] || row['Location'] || '').trim().toLowerCase();
      const categoryId = categoryName ? (catMap.get(categoryName) ?? null) : null;
      const locationId = locationName ? (locMap.get(locationName) ?? null) : null;

      if (categoryName && !categoryId) {
        errors.push(`Row ${rowNum}: category "${row['categoryName'] || row['Category']}" not found`);
        continue;
      }
      if (locationName && !locationId) {
        errors.push(`Row ${rowNum}: location "${row['locationName'] || row['Location']}" not found`);
        continue;
      }

      toInsert.push({
        assetName: name,
        assetTag: tag,
        serialNumber: serial,
        brand: String(row['brand'] || row['Brand'] || '').trim() || null,
        model: String(row['model'] || row['Model'] || '').trim() || null,
        purchaseDate: parseDate(row['purchaseDate'] || row['Purchase Date']),
        purchasePrice: parseFloat(row['purchasePrice'] || row['Purchase Price']) || null,
        warrantyExpiry: parseDate(row['warrantyExpiry'] || row['Warranty Expiry']),
        supplierName: String(row['supplierName'] || row['Supplier'] || '').trim() || null,
        notes: String(row['notes'] || row['Notes'] || '').trim() || null,
        condition: conditionRaw,
        status: statusRaw,
        categoryId,
        locationId,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    // Check for existing tags/serials in DB
    const [existingTags, existingSerials] = await Promise.all([
      prisma.asset.findMany({ where: { assetTag: { in: toInsert.map(r => r.assetTag) } }, select: { assetTag: true } }),
      prisma.asset.findMany({ where: { serialNumber: { in: toInsert.map(r => r.serialNumber) } }, select: { serialNumber: true } }),
    ]);

    const dbDupErrors: string[] = [];
    existingTags.forEach(a => dbDupErrors.push(`assetTag "${a.assetTag}" already exists in the system`));
    existingSerials.forEach(a => dbDupErrors.push(`serialNumber "${a.serialNumber}" already exists in the system`));
    if (dbDupErrors.length > 0) {
      return NextResponse.json({ errors: dbDupErrors }, { status: 422 });
    }

    await prisma.asset.createMany({ data: toInsert });

    return NextResponse.json({ inserted: toInsert.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
