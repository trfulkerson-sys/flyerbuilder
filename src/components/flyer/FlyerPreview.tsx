'use client'

import { useState, useRef, useCallback } from 'react'
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
  onPositionChange?: (x: number, y: number) => void
}

export default function FlyerPreview({ data, interestRate, loanOfficer, onPositionChange }: FlyerPreviewProps) {
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null)
  const photoContainerRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (!data.propertyPhotoUrl || !onPositionChange) return
    setIsDragging(true)
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      posX: data.photoPositionX,
      posY: data.photoPositionY,
    }
  }, [data.propertyPhotoUrl, data.photoPositionX, data.photoPositionY, onPositionChange])

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !onPositionChange || !photoContainerRef.current) return

    const container = photoContainerRef.current
    const rect = container.getBoundingClientRect()

    // Calculate the delta as a percentage of the container
    // Invert the direction so dragging right moves the image right (shows left side)
    const deltaX = ((dragStartRef.current.x - clientX) / rect.width) * 100
    const deltaY = ((dragStartRef.current.y - clientY) / rect.height) * 100

    // Apply zoom factor - more zoom means less movement needed
    const zoomFactor = data.photoZoom / 100
    const adjustedDeltaX = deltaX / zoomFactor
    const adjustedDeltaY = deltaY / zoomFactor

    // Calculate new position, clamped to 0-100
    const newX = Math.max(0, Math.min(100, dragStartRef.current.posX + adjustedDeltaX))
    const newY = Math.max(0, Math.min(100, dragStartRef.current.posY + adjustedDeltaY))

    onPositionChange(newX, newY)
  }, [isDragging, onPositionChange, data.photoZoom])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    dragStartRef.current = null
  }, [])

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  const handleMouseLeave = () => {
    if (isDragging) handleDragEnd()
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ aspectRatio: '8.5/11', fontSize: '0.6rem' }}>
      {/* Property Photo Area */}
      <div
        ref={photoContainerRef}
        className={`relative h-[30%] bg-gray-300 overflow-hidden ${data.propertyPhotoUrl && onPositionChange ? 'cursor-move' : ''} ${isDragging ? 'select-none' : ''}`}
        onMouseDown={data.propertyPhotoUrl ? handleMouseDown : undefined}
        onMouseMove={data.propertyPhotoUrl ? handleMouseMove : undefined}
        onMouseUp={data.propertyPhotoUrl ? handleMouseUp : undefined}
        onMouseLeave={data.propertyPhotoUrl ? handleMouseLeave : undefined}
        onTouchStart={data.propertyPhotoUrl ? handleTouchStart : undefined}
        onTouchMove={data.propertyPhotoUrl ? handleTouchMove : undefined}
        onTouchEnd={data.propertyPhotoUrl ? handleTouchEnd : undefined}
      >
        {data.propertyPhotoUrl ? (
          <img
            src={data.propertyPhotoUrl}
            alt="Property"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{
              objectPosition: `${data.photoPositionX}% ${data.photoPositionY}%`,
              transform: `scale(${data.photoZoom / 100})`,
              transformOrigin: `${data.photoPositionX}% ${data.photoPositionY}%`
            }}
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Property Photo</span>
            </div>
          </div>
        )}

        {/* Drag hint overlay */}
        {data.propertyPhotoUrl && onPositionChange && !isDragging && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Drag to reposition</span>
          </div>
        )}

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
      <div className="p-3 h-[70%] flex flex-col overflow-hidden">
        {/* Headline */}
        <div className="text-center mb-2">
          <h1 className="text-base font-bold text-black leading-tight">KATALYST KICKSTART</h1>
          <h2 className="text-lg font-black text-black">1% RATE REDUCTION</h2>
        </div>

        {/* Address line */}
        <div className="text-center border-b-2 border-black pb-1 mb-2 text-[10px] text-black">
          <span className="font-semibold">{fullAddress}</span>
          <span className="mx-3 text-gray-600">|</span>
          <span className="text-gray-800">{propertySpecs}</span>
        </div>

        {/* Payment Comparison */}
        <div className="text-center mb-1">
          <h3 className="font-bold text-[10px] text-black">EXCLUSIVE PROPERTY INCENTIVE</h3>
        </div>

        <div className="border border-gray-300 rounded-lg p-2 mb-2">
          <div className="text-center text-[9px] font-semibold mb-1 text-black">PAYMENT COMPARISON</div>
          <div className="text-center text-[8px] text-gray-600 mb-1">*payments based on {data.downPaymentPercent}% down payment</div>

          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="text-gray-700 text-[8px]">Standard Rate Payment</div>
              <div className="text-[8px] text-gray-600">Rate: {formatRate(calculation.standardRate)}</div>
              <div className="text-sm font-bold text-black">{formatCurrency(calculation.standardPayment)}</div>
              <div className="text-[8px] text-gray-600">Principal & Interest</div>
            </div>
            <div className="text-center bg-green-50 rounded p-1">
              <div className="text-green-700 text-[8px]">Year 1 Katalyst Kickstart Payment</div>
              <div className="text-[8px] text-green-600">Rate: {formatRate(calculation.kickstartRate)}</div>
              <div className="text-sm font-bold text-green-800">{formatCurrency(calculation.kickstartPayment)}</div>
              <div className="text-[8px] text-green-600">Principal & Interest</div>
            </div>
          </div>
        </div>

        {/* Savings Breakdown */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-2 mb-2">
          <h3 className="text-center font-bold text-[9px] mb-1">FIRST YEAR SAVINGS BREAKDOWN</h3>

          <div className="grid grid-cols-3 gap-1 mb-1">
            <div className="text-center">
              <div className="text-[8px] opacity-80">Monthly Savings</div>
              <div className="text-sm font-bold">{formatCurrency(calculation.monthlySavings)}</div>
              <div className="text-[7px] opacity-70">Every month in Year 1</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] opacity-80">Annual Savings</div>
              <div className="text-sm font-bold">{formatCurrency(calculation.annualSavings)}</div>
              <div className="text-[7px] opacity-70">Total Year 1 savings</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] opacity-80">Lender Credit</div>
              <div className="text-sm font-bold">{formatCurrency(calculation.lenderCredit)}</div>
              <div className="text-[7px] opacity-70">Required to fund program</div>
            </div>
          </div>

          <div className="text-center text-[8px] border-t border-white/30 pt-1">
            <div>$6,000 Program Maximum</div>
            <div className="font-semibold">100% Lender-Paid Program</div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[7px] text-gray-500 text-center mb-1">
          Example scenario for illustration purposes only. Rate, terms and eligibility vary and are subject to lender approval.
        </div>

        {/* Footer with contact info */}
        <div className="border-t pt-1 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1">
            {/* Realtor photo placeholder */}
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[6px] text-gray-500">Photo</span>
            </div>
            <div>
              <div className="font-bold text-[8px]">REALTOR NAME</div>
              <div className="text-[7px] text-gray-600">LIC #00000000</div>
              <div className="text-[7px] text-gray-600">(000) 000-0000</div>
            </div>
          </div>

          <div className="text-right">
            <div className="font-bold text-[8px]">THE KATALYST TEAM</div>
            <div className="text-[7px] text-gray-600">NMLS #{loanOfficer.nmls_number}</div>
            <div className="text-[7px] text-gray-600">{loanOfficer.phone}</div>
          </div>

          {/* QR Code placeholder */}
          <div className="w-8 h-8 bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span className="text-[5px] text-gray-500">QR</span>
          </div>
        </div>
      </div>
    </div>
  )
}
