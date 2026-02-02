'use client'

import { useState, useEffect } from 'react'
import { calculateKickstart, formatCurrency, formatRate } from '@/lib/calculator/kickstart'

export interface FlyerData {
  propertyAddress: string
  propertyCity: string
  propertyState: string
  propertyZip: string
  propertyPrice: number
  bedrooms: number
  bathrooms: number
  squareFootage: number
  downPaymentPercent: number
  interestRate: number
}

interface FlyerFormProps {
  data: FlyerData
  onChange: (data: FlyerData) => void
  interestRate: number
}

export default function FlyerForm({ data, onChange, interestRate }: FlyerFormProps) {
  // Format price for display
  const formatPriceDisplay = (value: number) => {
    if (!value) return ''
    return value.toLocaleString('en-US')
  }

  // Parse price from input
  const parsePriceInput = (value: string) => {
    return parseInt(value.replace(/[^0-9]/g, '')) || 0
  }

  const handleChange = (field: keyof FlyerData, value: string | number) => {
    onChange({ ...data, [field]: value })
  }

  // Calculate results for display
  const calculation = calculateKickstart({
    purchasePrice: data.propertyPrice,
    downPaymentPercent: data.downPaymentPercent,
    interestRate: interestRate,
  })

  return (
    <div className="space-y-6">
      {/* Property Address Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-[#403e36] mb-4">Property Address</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={data.propertyAddress}
              onChange={(e) => handleChange('propertyAddress', e.target.value)}
              placeholder="123 Main Street"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#403e36] focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={data.propertyCity}
                onChange={(e) => handleChange('propertyCity', e.target.value)}
                placeholder="San Diego"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#403e36] focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={data.propertyState}
                onChange={(e) => handleChange('propertyState', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="CA"
                maxLength={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#403e36] focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
              <input
                type="text"
                value={data.propertyZip}
                onChange={(e) => handleChange('propertyZip', e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                placeholder="92101"
                maxLength={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#403e36] focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Property Details Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-[#403e36] mb-4">Property Details</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Listing Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700">$</span>
              <input
                type="text"
                value={formatPriceDisplay(data.propertyPrice)}
                onChange={(e) => handleChange('propertyPrice', parsePriceInput(e.target.value))}
                placeholder="750,000"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#403e36] focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beds</label>
              <input
                type="number"
                value={data.bedrooms || ''}
                onChange={(e) => handleChange('bedrooms', parseInt(e.target.value) || 0)}
                placeholder="4"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#403e36] focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Baths</label>
              <input
                type="number"
                value={data.bathrooms || ''}
                onChange={(e) => handleChange('bathrooms', parseFloat(e.target.value) || 0)}
                placeholder="2.5"
                min="0"
                step="0.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#403e36] focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sq Ft</label>
              <input
                type="text"
                value={data.squareFootage ? data.squareFootage.toLocaleString() : ''}
                onChange={(e) => handleChange('squareFootage', parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                placeholder="2,500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#403e36] focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Down Payment: {data.downPaymentPercent}%
            </label>
            <input
              type="range"
              value={data.downPaymentPercent}
              onChange={(e) => handleChange('downPaymentPercent', parseInt(e.target.value))}
              min="3"
              max="50"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>3%</span>
              <span>{formatCurrency(data.propertyPrice * (data.downPaymentPercent / 100))}</span>
              <span>50%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Results */}
      {data.propertyPrice > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg shadow p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Kickstart Savings Preview</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-sm opacity-80">Standard Payment</div>
              <div className="text-xl font-bold">{formatCurrency(calculation.standardPayment)}</div>
              <div className="text-xs opacity-70">at {formatRate(calculation.standardRate)}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <div className="text-sm opacity-80">Kickstart Payment</div>
              <div className="text-xl font-bold">{formatCurrency(calculation.kickstartPayment)}</div>
              <div className="text-xs opacity-70">at {formatRate(calculation.kickstartRate)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold">{formatCurrency(calculation.monthlySavings)}</div>
              <div className="text-xs opacity-80">Monthly Savings</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(calculation.annualSavings)}</div>
              <div className="text-xs opacity-80">Annual Savings</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(calculation.lenderCredit)}</div>
              <div className="text-xs opacity-80">Lender Credit</div>
            </div>
          </div>

          {calculation.savingsWasCapped && (
            <div className="mt-3 text-xs text-center bg-white/10 rounded py-1">
              $6,000 annual program maximum applied
            </div>
          )}

          <div className="mt-3 text-xs text-center opacity-70">
            Current rate: {formatRate(interestRate)} (live from market)
          </div>
        </div>
      )}
    </div>
  )
}
