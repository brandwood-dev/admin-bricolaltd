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

    const setup = async () => {
      let ImageResizeModule: any = null
      try {
        const mod = await import('quill-image-resize-module')
        ImageResizeModule = (mod as any).default || mod
        Quill.register('modules/imageResize', ImageResizeModule)
      } catch {}

    // Configure image handler to prevent content loss
    const imageHandler = () => {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.setAttribute('accept', 'image/png, image/jpeg, image/webp, image/gif')
      input.click()

      input.onchange = async () => {
        const file = input.files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const range = quill.getSelection()
            const index = range ? range.index : quill.getLength()
            
            // Insert image at current position
            quill.insertEmbed(index, 'image', e.target?.result)
            
            // Move cursor after image and add a paragraph break
            quill.setSelection(index + 1)
            quill.insertText(index + 1, '\n')
            quill.setSelection(index + 2)
          }
          reader.readAsDataURL(file)
        }
      }
    }

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      modules: {
        ...modules,
        toolbar: {
          container: modules?.toolbar || [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            ['clean'],
          ],
          handlers: {
            image: imageHandler,
            ...modules?.toolbar?.handlers,
          },
        },
        imageResize: ImageResizeModule
          ? {
              displaySize: true,
              modules: ['Resize', 'DisplaySize'],
            }
          : undefined,
      },
      formats: [...formats, 'width', 'height', 'style'],
      placeholder,
    })

    quillRef.current = quill

    // Set initial content
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value)
      lastHtmlRef.current = value
    }

    // Listen to changes - process images for better storage
    const handleTextChange = () => {
      const html = quill.root.innerHTML
      
      // Process images to ensure they're properly formatted
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      
      const images = tempDiv.querySelectorAll('img')
      images.forEach(img => {
        if (!img.getAttribute('alt')) {
          img.setAttribute('alt', 'Image')
        }
        // Ensure proper styling
        img.style.maxWidth = '100%'
        img.style.height = 'auto'
        
        // Log image data for debugging
        const src = img.getAttribute('src')
        if (src && src.startsWith('data:')) {
          console.log('[RichTextEditor] Found base64 image:', src.substring(0, 50) + '...')
        }
      })
      
      const processedHtml = tempDiv.innerHTML
      lastHtmlRef.current = processedHtml
      onChange(processedHtml)
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
    }

    void setup()
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