'use client'

import { FlyerData } from './FlyerForm'
import { calculateKickstart, formatCurrency, formatRate } from '@/lib/calculator/kickstart'

interface FlyerPreviewPrintProps {
  data: FlyerData
  interestRate: number
  loanOfficer: {
    name: string
    phone: string
    nmls_number: string
  }
}

// Print-optimized version of FlyerPreview (no drag handlers, fixed sizing for PDF)
export default function FlyerPreviewPrint({ data, interestRate, loanOfficer }: FlyerPreviewPrintProps) {
  const calculation = calculateKickstart({
    purchasePrice: data.propertyPrice,
    downPaymentPercent: data.downPaymentPercent,
    interestRate: interestRate,
  })

  const fullAddress = [
    data.propertyAddress,
    data.propertyCity,
    data.propertyState,
    data.propertyZip
  ].filter(Boolean).join(', ') || 'Property Address'

  const propertySpecs = [
    data.bedrooms ? `${data.bedrooms} BD` : null,
    data.bathrooms ? `${data.bathrooms} BA` : null,
    data.squareFootage ? `${data.squareFootage.toLocaleString()} SF` : null,
  ].filter(Boolean).join(' // ') || 'Beds // Baths // Sq Ft'

  return (
    <div
      className="bg-white overflow-hidden"
      style={{
        width: '8.5in',
        height: '11in',
        fontSize: '12pt',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Property Photo Area - 30% of page */}
      <div
        className="relative overflow-hidden bg-gray-300"
        style={{ height: '30%' }}
      >
        {data.propertyPhotoUrl ? (
          <img
            src={data.propertyPhotoUrl}
            alt="Property"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: `${data.photoPositionX}% ${data.photoPositionY}%`,
              transform: `scale(${data.photoZoom / 100})`,
              transformOrigin: `${data.photoPositionX}% ${data.photoPositionY}%`
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <span style={{ fontSize: '14pt' }}>Property Photo</span>
            </div>
          </div>
        )}

        {/* ETHOS logo */}
        <div
          className="absolute bg-black rounded-full flex items-center justify-center"
          style={{ top: '20px', right: '20px', width: '70px', height: '70px' }}
        >
          <span className="text-white font-bold" style={{ fontSize: '12pt' }}>ETHOS</span>
        </div>

        {/* Price banner */}
        <div className="absolute bottom-0 left-0 bg-black text-white" style={{ padding: '12px 24px' }}>
          <span className="font-bold" style={{ fontSize: '14pt' }}>
            FOR SALE: {data.propertyPrice ? formatCurrency(data.propertyPrice) : '$000,000'}
          </span>
        </div>
      </div>

      {/* Content Area - 70% of page */}
      <div className="flex flex-col" style={{ height: '70%', padding: '24px' }}>
        {/* Headline */}
        <div className="text-center" style={{ marginBottom: '16px' }}>
          <h1 className="font-bold text-black leading-tight" style={{ fontSize: '20pt' }}>KATALYST KICKSTART</h1>
          <h2 className="font-black text-black" style={{ fontSize: '28pt' }}>1% RATE REDUCTION</h2>
        </div>

        {/* Address line */}
        <div
          className="text-center text-black"
          style={{
            borderBottom: '2px solid black',
            paddingBottom: '8px',
            marginBottom: '16px',
            fontSize: '11pt'
          }}
        >
          <span className="font-semibold">{fullAddress}</span>
          <span style={{ margin: '0 16px', color: '#666' }}>|</span>
          <span style={{ color: '#444' }}>{propertySpecs}</span>
        </div>

        {/* Payment Comparison */}
        <div className="text-center" style={{ marginBottom: '8px' }}>
          <h3 className="font-bold text-black" style={{ fontSize: '11pt' }}>EXCLUSIVE PROPERTY INCENTIVE</h3>
        </div>

        <div
          className="rounded-lg"
          style={{
            border: '1px solid #ccc',
            padding: '16px',
            marginBottom: '16px'
          }}
        >
          <div className="text-center font-semibold text-black" style={{ fontSize: '10pt', marginBottom: '8px' }}>
            PAYMENT COMPARISON
          </div>
          <div className="text-center" style={{ fontSize: '9pt', color: '#666', marginBottom: '12px' }}>
            *payments based on {data.downPaymentPercent}% down payment
          </div>

          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            <div className="text-center">
              <div style={{ fontSize: '9pt', color: '#555' }}>Standard Rate Payment</div>
              <div style={{ fontSize: '9pt', color: '#666' }}>Rate: {formatRate(calculation.standardRate)}</div>
              <div className="font-bold text-black" style={{ fontSize: '18pt' }}>{formatCurrency(calculation.standardPayment)}</div>
              <div style={{ fontSize: '9pt', color: '#666' }}>Principal & Interest</div>
            </div>
            <div className="text-center rounded" style={{ backgroundColor: '#f0fdf4', padding: '8px' }}>
              <div style={{ fontSize: '9pt', color: '#15803d' }}>Year 1 Katalyst Kickstart Payment</div>
              <div style={{ fontSize: '9pt', color: '#16a34a' }}>Rate: {formatRate(calculation.kickstartRate)}</div>
              <div className="font-bold" style={{ fontSize: '18pt', color: '#166534' }}>{formatCurrency(calculation.kickstartPayment)}</div>
              <div style={{ fontSize: '9pt', color: '#16a34a' }}>Principal & Interest</div>
            </div>
          </div>
        </div>

        {/* Savings Breakdown */}
        <div
          className="text-white rounded-lg"
          style={{
            background: 'linear-gradient(to right, #9333ea, #6b21a8)',
            padding: '16px',
            marginBottom: '16px'
          }}
        >
          <h3 className="text-center font-bold" style={{ fontSize: '10pt', marginBottom: '12px' }}>
            FIRST YEAR SAVINGS BREAKDOWN
          </h3>

          <div className="grid grid-cols-3" style={{ gap: '8px', marginBottom: '12px' }}>
            <div className="text-center">
              <div style={{ fontSize: '9pt', opacity: 0.8 }}>Monthly Savings</div>
              <div className="font-bold" style={{ fontSize: '16pt' }}>{formatCurrency(calculation.monthlySavings)}</div>
              <div style={{ fontSize: '8pt', opacity: 0.7 }}>Every month in Year 1</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '9pt', opacity: 0.8 }}>Annual Savings</div>
              <div className="font-bold" style={{ fontSize: '16pt' }}>{formatCurrency(calculation.annualSavings)}</div>
              <div style={{ fontSize: '8pt', opacity: 0.7 }}>Total Year 1 savings</div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: '9pt', opacity: 0.8 }}>Lender Credit</div>
              <div className="font-bold" style={{ fontSize: '16pt' }}>{formatCurrency(calculation.lenderCredit)}</div>
              <div style={{ fontSize: '8pt', opacity: 0.7 }}>Required to fund program</div>
            </div>
          </div>

          <div
            className="text-center"
            style={{
              fontSize: '9pt',
              borderTop: '1px solid rgba(255,255,255,0.3)',
              paddingTop: '8px'
            }}
          >
            <div>$6,000 Program Maximum</div>
            <div className="font-semibold">100% Lender-Paid Program</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center" style={{ fontSize: '8pt', color: '#888', marginBottom: '12px' }}>
          Example scenario for illustration purposes only. Rate, terms and eligibility vary and are subject to lender approval.
        </div>

        {/* Footer with contact info */}
        <div
          className="flex items-center justify-between mt-auto"
          style={{ borderTop: '1px solid #ddd', paddingTop: '12px' }}
        >
          <div className="flex items-center" style={{ gap: '8px' }}>
            {/* Realtor photo placeholder */}
            <div
              className="bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ width: '50px', height: '50px' }}
            >
              <span style={{ fontSize: '7pt', color: '#888' }}>Photo</span>
            </div>
            <div>
              <div className="font-bold" style={{ fontSize: '10pt' }}>REALTOR NAME</div>
              <div style={{ fontSize: '9pt', color: '#666' }}>LIC #00000000</div>
              <div style={{ fontSize: '9pt', color: '#666' }}>(000) 000-0000</div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-bold" style={{ fontSize: '10pt' }}>THE KATALYST TEAM</div>
            <div style={{ fontSize: '9pt', color: '#666' }}>NMLS #{loanOfficer.nmls_number}</div>
            <div style={{ fontSize: '9pt', color: '#666' }}>{loanOfficer.phone}</div>
          </div>

          {/* QR Code placeholder */}
          <div
            className="bg-gray-200 flex items-center justify-center flex-shrink-0"
            style={{ width: '50px', height: '50px' }}
          >
            <span style={{ fontSize: '7pt', color: '#888' }}>QR</span>
          </div>
        </div>
      </div>
    </div>
  )
}
