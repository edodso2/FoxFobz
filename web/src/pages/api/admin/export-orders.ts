import type { APIRoute } from 'astro';
import { searchOrders } from '../../../lib/orders';
import { csvResponse, toCsv } from '../../../lib/csv';
import { shippingPackage } from '../../../site.config';

export const prerender = false;

// CSV for Pirate Ship's "Import spreadsheet" upload. Pirate Ship lets you map
// columns on upload; these headers match its suggested names.
const HEADER = [
  'Name',
  'Company',
  'Address',
  'Address Line 2',
  'City',
  'State',
  'Zipcode',
  'Country',
  'Email',
  'Phone',
  'Order ID',
  'Quantity',
  'Pounds',
  'Ounces',
  'Length',
  'Width',
  'Height',
  'Description',
];

export const GET: APIRoute = async () => {
  const { orders, truncated } = await searchOrders({ status: 'unfulfilled', limit: 1000 });
  if (truncated) console.warn('More than 1000 unshipped orders; the export includes only some of them');
  orders.reverse(); // oldest first

  const rows = orders.map((o) => {
    const a = o.address;
    const totalOz = shippingPackage.weightOz + Math.max(0, o.quantity - 1) * shippingPackage.extraKitWeightOz;
    return [
      o.name,
      '',
      a?.line1,
      a?.line2,
      a?.city,
      a?.state,
      a?.postal_code,
      a?.country ?? 'US',
      o.email,
      o.phone,
      o.id,
      o.quantity,
      Math.floor(totalOz / 16),
      totalOz % 16,
      shippingPackage.lengthIn,
      shippingPackage.widthIn,
      shippingPackage.heightIn,
      `${shippingPackage.description}${o.year ? ` — ${o.year} ${o.bodyStyle ?? ''}`.trimEnd() : ''}`,
    ];
  });

  const date = new Date().toISOString().slice(0, 10);
  return csvResponse(toCsv(HEADER, rows), `foxfobz-unshipped-${date}.csv`);
};
