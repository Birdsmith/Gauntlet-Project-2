import React from 'react'

export const TestComponent: React.FC = () => {
  return (
    <div className="p-4 bg-blue-100 rounded-lg">
      <h2 className="text-lg font-semibold">Test Component from Common Package</h2>
      <p>If you can see this, the common package is working!</p>
    </div>
  )
}
