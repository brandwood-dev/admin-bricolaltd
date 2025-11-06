import React, { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  onBlur?: () => void
  modules?: any
  formats?: string[]
  placeholder?: string
  style?: React.CSSProperties
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onBlur,
  modules,
  formats,
  placeholder,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<Quill | null>(null)
  const lastHtmlRef = useRef<string>('')

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Quill instance
    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      modules,
      formats,
      placeholder,
    })

    quillRef.current = quill

    // Set initial content
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value)
      lastHtmlRef.current = value
    }

    // Listen to changes
    const handleTextChange = () => {
      const html = quill.root.innerHTML
      lastHtmlRef.current = html
      onChange(html)
    }

    const handleSelectionChange = (range: any) => {
      if (range == null && onBlur) {
        onBlur()
      }
    }

    quill.on('text-change', handleTextChange)
    quill.on('selection-change', handleSelectionChange as any)

    return () => {
      quill.off('text-change', handleTextChange)
      quill.off('selection-change', handleSelectionChange as any)
      quillRef.current = null
    }
  }, [])

  // Update content if value prop changes externally
  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return
    const currentHtml = quill.root.innerHTML
    if (value !== undefined && value !== currentHtml && value !== lastHtmlRef.current) {
      const selection = quill.getSelection()
      quill.clipboard.dangerouslyPasteHTML(value || '')
      if (selection) quill.setSelection(selection)
      lastHtmlRef.current = value || ''
    }
  }, [value])

  return (
    <div
      className='quill-container'
      style={{ minHeight: '300px', ...style }}
    >
      <div ref={containerRef} />
    </div>
  )
}

export default RichTextEditor