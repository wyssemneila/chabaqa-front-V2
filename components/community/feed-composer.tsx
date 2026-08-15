'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Image as ImageIcon, Video, Link2, Smile, Paperclip,
  BarChart3, X, Plus, Trash2,
} from 'lucide-react'

interface FeedPost {
  id: string
  title: string
  content: string
  images: string[]
  poll: { question: string; options: string[] } | null
  emoji: string[]
  time: string
}

interface Props {
  communityName: string
  avatarColor: string
  onPost: (post: FeedPost) => void
}

const EMOJI_LIST = ['😀','😂','😍','🥳','🔥','💯','👏','🎉','❤️','😎','🤔','👀','💪','🙌','✨','🚀','💡','🎯','⭐','👍','😊','🤩','💜','🫶','😅','🤣','😭','🥹','💀','👑']

export default function FeedComposer({ communityName, avatarColor, onPost }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<{ name: string; url: string }[]>([])
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [pollActive, setPollActive] = useState(false)
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [linkInput, setLinkInput] = useState(false)
  const [linkValue, setLinkValue] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const vidRef = useRef<HTMLInputElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false)
        setShowGif(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(f => {
      const url = URL.createObjectURL(f)
      setImages(prev => [...prev, { name: f.name, url }])
    })
    e.target.value = ''
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  function addPollOption() {
    if (pollOptions.length < 6) setPollOptions(prev => [...prev, ''])
  }

  function removePollOption(idx: number) {
    if (pollOptions.length > 2) setPollOptions(prev => prev.filter((_, i) => i !== idx))
  }

  function updatePollOption(idx: number, val: string) {
    setPollOptions(prev => prev.map((o, i) => i === idx ? val : o))
  }

  function insertEmoji(emoji: string) {
    setContent(prev => prev + emoji)
    setShowEmoji(false)
  }

  function handlePost() {
    if (!content.trim() && !title.trim() && images.length === 0 && !pollActive) return
    const post: FeedPost = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      images: images.map(i => i.url),
      poll: pollActive && pollOptions.some(o => o.trim()) ? { question: title || content, options: pollOptions.filter(o => o.trim()) } : null,
      emoji: [],
      time: 'Just now',
    }
    onPost(post)
    setTitle('')
    setContent('')
    setImages([])
    setPollActive(false)
    setPollOptions(['', ''])
    setLinkInput(false)
    setLinkValue('')
    setOpen(false)
  }

  function handleCancel() {
    setTitle('')
    setContent('')
    setImages([])
    setPollActive(false)
    setPollOptions(['', ''])
    setLinkInput(false)
    setLinkValue('')
    setOpen(false)
  }

  if (!open) {
    return (
      <div onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ border: '1px solid #e8e8e8', background: '#fafbfc' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0"
          style={{ background: avatarColor }}>
          WN
        </div>
        <span className="text-[14px] text-gray-400">Write something...</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4dffb' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#faf8ff', borderBottom: '1px solid #f0eeff' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[9px] flex-shrink-0"
            style={{ background: avatarColor }}>
            WN
          </div>
          <span className="text-[13px] text-gray-600">
            <span className="font-semibold text-gray-900">Wyssem Neila</span>
            {' '}posting in{' '}
            <span className="font-semibold" style={{ color: '#8e78fb' }}>{communityName}</span>
          </span>
        </div>
        <button onClick={handleCancel} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 bg-white">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 outline-none mb-3" />
        <textarea rows={3} value={content} onChange={e => setContent(e.target.value)}
          placeholder="Write something..."
          className="w-full text-[13.5px] text-gray-700 placeholder:text-gray-400 bg-transparent outline-none resize-none leading-relaxed" />

        {/* Link input */}
        {linkInput && (
          <div className="mt-3 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
            <input type="url" value={linkValue} onChange={e => setLinkValue(e.target.value)}
              placeholder="Paste a link..."
              className="flex-1 text-[13px] text-blue-600 placeholder:text-gray-300 outline-none border-b border-gray-200 pb-1 focus:border-[#8e78fb] transition-colors" />
            <button onClick={() => { setLinkInput(false); setLinkValue('') }}
              className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Uploaded images preview */}
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img.url} alt={img.name} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                <button onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
                <p className="text-[9px] text-gray-400 mt-0.5 max-w-[80px] truncate">{img.name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Poll builder */}
        {pollActive && (
          <div className="mt-4 p-3 rounded-lg" style={{ background: '#f9f8fe', border: '1px solid #e8e4ff' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold" style={{ color: '#6c52f0' }}>Poll</span>
              <button onClick={() => { setPollActive(false); setPollOptions(['', '']) }}
                className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
            </div>
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-gray-400 w-4 text-center">{i + 1}</span>
                <input type="text" value={opt} onChange={e => updatePollOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 h-9 px-3 rounded-lg text-[13px] bg-white border border-gray-200 outline-none focus:border-[#8e78fb] transition-colors" />
                {pollOptions.length > 2 && (
                  <button onClick={() => removePollOption(i)} className="text-gray-300 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 6 && (
              <button onClick={addPollOption}
                className="flex items-center gap-1 text-[12px] font-medium mt-1 px-2 py-1 rounded-md hover:bg-white transition-colors"
                style={{ color: '#8e78fb' }}>
                <Plus className="w-3 h-3" /> Add option
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer toolbar */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#fafbfc', borderTop: '1px solid #f0f0f0' }}>
        <div className="flex items-center gap-0.5 relative" ref={emojiRef}>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} multiple />
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} multiple />
          <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />

          <button onClick={() => fileRef.current?.click()} title="Attach file"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Paperclip className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => imgRef.current?.click()} title="Image"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ImageIcon className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => vidRef.current?.click()} title="Video"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Video className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => setLinkInput(true)} title="Link"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <Link2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => { setPollActive(true); setShowEmoji(false); setShowGif(false) }} title="Poll"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            style={pollActive ? { color: '#8e78fb', background: '#f4f2fc' } : {}}>
            <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => { setShowEmoji(!showEmoji); setShowGif(false) }} title="Emoji"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            style={showEmoji ? { color: '#8e78fb', background: '#f4f2fc' } : {}}>
            <Smile className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => { setShowGif(!showGif); setShowEmoji(false) }} title="GIF"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            style={showGif ? { color: '#8e78fb', background: '#f4f2fc' } : {}}>
            <span className="text-[10px] font-bold leading-none">GIF</span>
          </button>

          {/* Emoji picker */}
          {showEmoji && (
            <div className="absolute bottom-10 left-0 z-50 bg-white rounded-xl shadow-lg p-3 grid grid-cols-6 gap-1"
              style={{ border: '1px solid #e8e4ff', width: 220 }}>
              {EMOJI_LIST.map(e => (
                <button key={e} onClick={() => insertEmoji(e)}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-lg hover:bg-gray-100 transition-colors">
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* GIF placeholder */}
          {showGif && (
            <div className="absolute bottom-10 left-0 z-50 bg-white rounded-xl shadow-lg p-4"
              style={{ border: '1px solid #e8e4ff', width: 260 }}>
              <input type="text" placeholder="Search GIFs..."
                className="w-full h-8 px-3 rounded-lg text-[12px] bg-gray-50 border border-gray-200 outline-none mb-3 focus:border-[#8e78fb] transition-colors" />
              <div className="grid grid-cols-2 gap-2">
                {['🎉','🔥','👏','😂'].map((g, i) => (
                  <button key={i} onClick={() => { setContent(prev => prev + ' ' + g); setShowGif(false) }}
                    className="h-16 rounded-lg flex items-center justify-center text-2xl hover:bg-gray-50 transition-colors"
                    style={{ background: '#f9f8fe', border: '1px solid #f0f0f0' }}>
                    {g}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">GIF search coming soon</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleCancel}
            className="h-8 px-3 rounded-lg text-[12px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">
            CANCEL
          </button>
          <button onClick={handlePost}
            className="h-8 px-5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #8e78fb, #6c52f0)' }}
            disabled={!content.trim() && !title.trim() && images.length === 0 && !pollActive}>
            POST
          </button>
        </div>
      </div>
    </div>
  )
}
