import {
  FileText,
  FileArchive,
  FileAudio,
  FileVideo,
  FileInput,
} from "lucide-react"

export function getFileTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'pdf':
      return <FileText className="h-4 w-4 mr-2 text-red-500" />
    case 'zip':
    case 'rar':
      return <FileArchive className="h-4 w-4 mr-2 text-yellow-500" />
    case 'mp3':
    case 'wav':
      return <FileAudio className="h-4 w-4 mr-2 text-blue-500" />
    case 'mp4':
    case 'mov':
      return <FileVideo className="h-4 w-4 mr-2 text-purple-500" />
    case 'psd':
    case 'ai':
    case 'figma':
      return <FileInput className="h-4 w-4 mr-2 text-green-500" />
    default:
      return <FileText className="h-4 w-4 mr-2 text-gray-500" />
  }
}