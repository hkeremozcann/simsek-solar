import React from 'react'

interface PageHeaderProps {
  baslik: string
  aciklama?: string
  eylemler?: React.ReactNode
  geri?: boolean
}

export function PageHeader({ baslik, aciklama, eylemler }: PageHeaderProps) {
  return (
    <header className="bg-white border-b border-[#D6DCE3] px-4 md:px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold text-[#0F1F33]"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            {baslik}
          </h1>
          {aciklama && (
            <p className="text-sm text-[#6B7785] mt-0.5">{aciklama}</p>
          )}
        </div>
        {eylemler && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {eylemler}
          </div>
        )}
      </div>
    </header>
  )
}
