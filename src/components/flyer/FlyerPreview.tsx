'use client'

import { FlyerData } from './FlyerForm'
import { calculateKickstart, formatCurrency, formatRate } from '@/lib/calculator/kickstart'

interface FlyerPreviewProps {
  data: FlyerData
  interestRate: number
  loanOfficer: {
    name: string
    phone: string
    nmls_number: string
  }
}

export default function FlyerPreview({ data, interestRate, loanOfficer }: FlyerPreviewProps) {
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ aspectRatio: '8.5/11' }}>
      {/* Property Photo Area */}
      <div className="relative h-[35%] bg-gray-300">
        {/* Placeholder for property photo */}
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Property Photo</span>
          </div>
        </div>

        {/* ETHOS logo placeholder */}
        <div className="absolute top-3 right-3 w-12 h-12 bg-black rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">ETHOS</span>
        </div>

        {/* Price banner */}
        <div className="absolute bottom-0 left-0 bg-black text-white px-4 py-2">
          <span className="font-bold">FOR SALE: {data.propertyPrice ? formatCurrency(data.propertyPrice) : '$000,000'}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 h-[65%] flex flex-col text-xs">
        {/* Headline */}
        <div className="text-center mb-3">
          <h1 className="text-xl font-bold text-black leading-tight">KATALYST KICKSTART</h1>
          <h2 className="text-2xl font-black text-black">1% RATE REDUCTION</h2>
        </div>

        {/* Address line */}
        <div className="text-center border-b-2 border-black pb-2 mb-3">
          <span className="font-semibold">{fullAddress}</span>
          <span className="mx-3 text-gray-400">|</span>
          <span>{propertySpecs}</span>
        </div>

        {/* Payment Comparison */}
        <div className="text-center mb-2">
          <h3 className="font-bold text-sm">EXCLUSIVE PROPERTY INCENTIVE</h3>
        </div>

        <div className="border border-gray-300 rounded-lg p-3 mb-3">
          <div className="text-center text-xs font-semibold mb-2">PAYMENT COMPARISON</div>
          <div className="text-center text-[10px] text-gray-500 mb-2">*payments based on {data.downPaymentPercent}% down payment</div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-gray-600 text-[10px]">Standard Rate Payment</div>
              <div className="text-[10px] text-gray-500">Rate: {formatRate(calculation.standardRate)}</div>
              <div className="text-lg font-bold">{formatCurrency(calculation.standardPayment)}</div>
              <div className="text-[10px] text-gray-500">Principal & Interest</div>
            </div>
            <div className="text-center bg-green-50 rounded p-1">
              <div className="text-green-700 text-[10px]">Year 1 Katalyst Kickstart Payment</div>
              <div className="text-[10px] text-green-600">Rate: {formatRate(calculation.kickstartRate)}</div>
              <div className="text-lg font-bold text-green-800">{formatCurrency(calculation.kickstartPayment)}</div>
              <div className="text-[10px] text-green-600">Principal & Interest</div>
            </div>
          </div>
        </div>

        {/* Savings Breakdown */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-3 mb-3 flex-grow">
          <h3 className="text-center font-bold text-sm mb-2">FIRST YEAR SAVINGS BREAKDOWN</h3>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="text-center">
              <div className="text-[10px] opacity-80">Monthly Savings</div>
              <div className="text-lg font-bold">{formatCurrency(calculation.monthlySavings)}</div>
              <div className="text-[8px] opacity-70">Every month in Year 1</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] opacity-80">Annual Savings</div>
              <div className="text-lg font-bold">{formatCurrency(calculation.annualSavings)}</div>
              <div className="text-[8px] opacity-70">Total Year 1 savings</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] opacity-80">Lender Credit</div>
              <div className="text-lg font-bold">{formatCurrency(calculation.lenderCredit)}</div>
              <div className="text-[8px] opacity-70">Required to fund program</div>
            </div>
          </div>

          <div className="text-center text-[10px] border-t border-white/30 pt-2">
            <div>$6,000 Program Maximum</div>
            <div className="font-semibold">100% Lender-Paid Program</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[8px] text-gray-500 text-center mb-2">
          Example scenario for illustration purposes only. Rate, terms and eligibility vary and are subject to lender approval.
        </div>

        {/* Footer with contact info */}
        <div className="border-t pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Realtor photo placeholder */}
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-gray-500">Photo</span>
            </div>
            <div>
              <div className="font-bold text-[10px]">REALTOR NAME</div>
              <div className="text-[8px] text-gray-600">REALTOR | LIC #00000000</div>
              <div className="text-[8px] text-gray-600">(000) 000-0000</div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-bold text-[10px]">THE KATALYST TEAM</div>
            <div className="text-[8px] text-gray-600">NMLS #{loanOfficer.nmls_number}</div>
            <div className="text-[8px] text-gray-600">{loanOfficer.phone}</div>
            <div className="text-[8px] text-gray-600">THEKATALYSTTEAM.COM</div>
          </div>

          {/* QR Code placeholder */}
          <div className="w-10 h-10 bg-gray-200 flex items-center justify-center">
            <span className="text-[6px] text-gray-500">QR</span>
          </div>
        </div>
      </div>
    </div>
  )
}
