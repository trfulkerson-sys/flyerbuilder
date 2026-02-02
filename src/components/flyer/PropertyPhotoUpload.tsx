'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PropertyPhotoUploadProps {
  photoUrl: string | null
  onPhotoChange: (url: string | null) => void
  positionX: number
  positionY: number
  onPositionChange: (x: number, y: number) => void
}

export default function PropertyPhotoUpload({
  photoUrl,
  onPhotoChange,
  positionX,
  positionY,
  onPositionChange
}: PropertyPhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `property-photos/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('flyer-assets')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('flyer-assets')
        .getPublicUrl(filePath)

      onPhotoChange(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }

  const handleRemove = () => {
    onPhotoChange(null)
    onPositionChange(50, 50) // Reset position
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-[#403e36] mb-4">Property Photo</h3>

      {photoUrl ? (
        // Photo preview with position controls
        <div>
          <div className="relative mb-4">
            <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={photoUrl}
                alt="Property"
                className="w-full h-full object-cover"
                style={{ objectPosition: `${positionX}% ${positionY}%` }}
              />
            </div>
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              title="Remove photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Position controls */}
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Adjust Photo Position</p>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Left</span>
                <span>Horizontal: {positionX}%</span>
                <span>Right</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={positionX}
                onChange={(e) => onPositionChange(parseInt(e.target.value), positionY)}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Top</span>
                <span>Vertical: {positionY}%</span>
                <span>Bottom</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={positionY}
                onChange={(e) => onPositionChange(positionX, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => onPositionChange(50, 50)}
              className="text-xs text-[#403e36] hover:underline"
            >
              Reset to center
            </button>
          </div>
        </div>
      ) : (
        // Upload area with drag and drop
        <label
          className="block cursor-pointer"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            uploading
              ? 'border-gray-300 bg-gray-50'
              : isDragging
                ? 'border-[#403e36] bg-[#FAF5F0]'
                : 'border-gray-300 hover:border-[#403e36]'
          }`}>
            {uploading ? (
              <div className="text-gray-500">
                <svg className="animate-spin h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uploading...</span>
              </div>
            ) : (
              <>
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-600 font-medium">
                  {isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-gray-400 text-sm mt-1">JPG, PNG up to 5MB</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      {!photoUrl && (
        <p className="text-gray-500 text-xs mt-3">
          Tip: Use a high-quality landscape photo for best results
        </p>
      )}
    </div>
  )
}
