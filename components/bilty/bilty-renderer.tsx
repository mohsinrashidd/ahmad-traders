'use client';

import * as React from 'react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { formatPKR, formatDate } from '@/lib/utils/format';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { addMonths } from '@/lib/utils/format';

type ProductData = {
  id: string;
  product_name: string;
  sale_price: number;
  cost_price: number;
  down_payment: number;
  monthly_installment: number;
  installment_count: number;
  purchase_start_date: string;
};

type CustomerData = {
  name: string;
  father_name: string | null;
  address: string | null;
  cnic: string | null;
  phone: string;
  serial_no: number;
} | null;

type ScheduleRow = {
  installment_number: number;
  due_date: string;
  expected_amount: number;
  paid_amount: number;
  is_paid: boolean;
  paid_on: string | null;
};

interface BiltyRendererProps {
  product: ProductData;
  customer: CustomerData;
  schedule: ScheduleRow[];
  receiptNo: string;
}

export function BiltyRenderer({
  product,
  customer,
  schedule,
  receiptNo,
}: BiltyRendererProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Bilty_${receiptNo}_${customer?.name ?? ''}`,
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `,
  });

  // End date = last installment due date
  const endDate = schedule.length > 0
    ? schedule[schedule.length - 1].due_date
    : addMonths(product.purchase_start_date, product.installment_count);

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Action Bar — hidden on print */}
      <div className="no-print flex items-center justify-between mb-6 gap-4">
        <Button variant="outline" asChild className="gap-2">
          <Link href={`/sales/${product.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Sale
          </Link>
        </Button>
        <Button onClick={() => handlePrint()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Bilty
        </Button>
      </div>

      {/* A4 Print Area */}
      <div
        ref={printRef}
        className="bg-white text-black"
        style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          padding: '10mm',
          fontFamily: 'Arial, sans-serif',
          position: 'relative',
          boxShadow: '0 0 20px rgba(0,0,0,0.15)',
        }}
      >
        {/* Watermark Stamp — centered */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ahmad-traders-stamp.png"
          alt="Ahmad Traders Stamp"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            opacity: 0.08,
            pointerEvents: 'none',
            objectFit: 'contain',
            zIndex: 0,
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ===== HEADER ===== */}
          <div style={{ textAlign: 'center', marginBottom: '8mm' }}>
            {/* Bismillah */}
            <div style={{ fontSize: '24px', marginBottom: '4px', fontFamily: 'serif' }}>
              ﷽
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px' }}>
              AHMAD TRADERS
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
              Installment Receipt / قسط رسید
            </div>
          </div>

          {/* Receipt No + Date Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6mm', fontSize: '12px' }}>
            <div>
              <strong>Receipt No:</strong> {receiptNo}
            </div>
            <div>
              <strong>Date:</strong> {formatDate(product.purchase_start_date)}
            </div>
          </div>

          {/* Divider */}
          <hr style={{ borderColor: '#333', marginBottom: '6mm' }} />

          {/* ===== CUSTOMER & PRODUCT INFO ===== */}
          {/* Bilingual label layout: Urdu label (right-aligned) | English value */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '6mm' }}>
            <tbody>
              <BiltyRow urduLabel="نام" englishLabel="Name" value={customer?.name ?? '—'} />
              <BiltyRow urduLabel="والد کا نام" englishLabel="Father's Name" value={customer?.father_name ?? '—'} />
              <BiltyRow urduLabel="پتہ" englishLabel="Address" value={customer?.address ?? '—'} />
              <BiltyRow urduLabel="شناختی کارڈ" englishLabel="CNIC" value={customer?.cnic ?? '—'} />
              <BiltyRow urduLabel="موبائل" englishLabel="Phone" value={customer?.phone ?? '—'} />
              <BiltyRow urduLabel="اشیاء" englishLabel="Product" value={product.product_name} />
              <BiltyRow urduLabel="لاگت قیمت" englishLabel="Cost Price" value={formatPKR(product.cost_price)} />
              <BiltyRow urduLabel="بیعانہ" englishLabel="Down Payment" value={formatPKR(product.down_payment)} />
              <BiltyRow urduLabel="کل قیمت" englishLabel="Total Price" value={formatPKR(product.sale_price)} />
              <BiltyRow urduLabel="ماہانہ قسط" englishLabel="Monthly Installment" value={formatPKR(product.monthly_installment)} bold />
              <BiltyRow urduLabel="آغاز تاریخ" englishLabel="Start Date" value={formatDate(product.purchase_start_date)} />
              <BiltyRow urduLabel="اختتام تاریخ" englishLabel="End Date" value={formatDate(endDate)} />
            </tbody>
          </table>

          {/* ===== INSTALLMENT GRID ===== */}
          <div style={{ marginTop: '4mm' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '3mm', borderBottom: '1px solid #333', paddingBottom: '2mm' }}>
              قسط کی تفصیل — Installment Details
            </div>

            {/* Tick boxes row (visual checkboxes for each installment) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '5mm' }}>
              {Array.from({ length: product.installment_count }).map((_, i) => {
                const instRow = schedule[i];
                const isPaid = instRow?.is_paid ?? false;
                return (
                  <div
                    key={i}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '1.5px solid #333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      backgroundColor: isPaid ? '#22c55e' : 'white',
                      color: isPaid ? 'white' : '#333',
                    }}
                  >
                    {isPaid ? '✓' : i + 1}
                  </div>
                );
              })}
            </div>

            {/* Installment Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '11px',
                border: '1px solid #333',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={thStyle}>قسط نمبر / #</th>
                  <th style={thStyle}>رقم / Amount</th>
                  <th style={thStyle}>تاریخ / Due Date</th>
                  <th style={thStyle}>ادائیگی تاریخ / Paid On</th>
                  <th style={thStyle}>دستخط / Sign</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.installment_number}>
                    <td style={tdStyle}>{row.installment_number}</td>
                    <td style={tdStyle}>{formatPKR(row.is_paid ? row.paid_amount : row.expected_amount)}</td>
                    <td style={tdStyle}>{formatDate(row.due_date)}</td>
                    <td style={tdStyle}>{row.paid_on ? formatDate(row.paid_on) : '—'}</td>
                    <td style={{ ...tdStyle, width: '80px' }}>{row.is_paid ? '✓' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '8mm', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555' }}>
            <div>
              <p>Owner&apos;s Signature: ___________________</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p>Ahmad Traders</p>
              <p style={{ fontSize: '10px' }}>Installment Management System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Bilingual row component
function BiltyRow({
  urduLabel,
  englishLabel,
  value,
  bold,
}: {
  urduLabel: string;
  englishLabel: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <tr style={{ borderBottom: '0.5px solid #e5e7eb' }}>
      <td
        style={{
          padding: '3px 8px',
          textAlign: 'right',
          direction: 'rtl',
          fontFamily: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", serif',
          fontSize: '13px',
          color: '#555',
          width: '30%',
        }}
      >
        {urduLabel}
      </td>
      <td style={{ padding: '3px 4px', color: '#888', fontSize: '11px', width: '25%' }}>
        {englishLabel}:
      </td>
      <td
        style={{
          padding: '3px 8px',
          fontWeight: bold ? 'bold' : 'normal',
          fontSize: bold ? '13px' : '12px',
        }}
      >
        {value}
      </td>
    </tr>
  );
}

const thStyle: React.CSSProperties = {
  padding: '5px 6px',
  border: '1px solid #333',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '10px',
};

const tdStyle: React.CSSProperties = {
  padding: '4px 6px',
  border: '1px solid #ddd',
  textAlign: 'center',
  fontSize: '11px',
};
