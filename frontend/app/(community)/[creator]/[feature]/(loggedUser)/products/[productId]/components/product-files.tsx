"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Lock, Download, FileText } from "lucide-react"
import { getFileTypeIcon } from "@/lib/utilsmedia"

interface ProductFilesProps {
  product: any
  isPurchased: boolean
  downloadProgress: {[key: string]: number}
  onDownload: (fileId: string) => void
}

export default function ProductFiles({ product, isPurchased, downloadProgress, onDownload }: ProductFilesProps) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm" id="files">
      <CardHeader className="pb-3 sm:pb-5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <CardTitle className="text-lg sm:text-xl">Download Files</CardTitle>
        </div>
        <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
          {isPurchased
            ? `Access all ${product.files?.length || 0} included files`
            : "Purchase to unlock all files"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 pb-5 sm:space-y-4 sm:pb-6">
        {product.files?.length > 0 ? (
          product.files.map((file: any) => (
            <div
              key={file.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
            >
              {/* File Info Section */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  {getFileTypeIcon ? getFileTypeIcon(file.type) : (
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate pr-2">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700 sm:text-xs">{file.type}</span>
                    {file.size && (
                      <>
                        <span className="mx-1.5">•</span>
                        <span>{file.size}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Section */}
              <div className="flex items-center justify-end sm:justify-start gap-2 sm:gap-0">
                {isPurchased ? (
                  downloadProgress[file.id] ? (
                    <div className="flex items-center gap-3 w-full sm:w-32">
                      <div className="flex-1 sm:flex-none sm:w-full">
                        <Progress value={downloadProgress[file.id]} className="h-2" />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 sm:hidden">
                        {Math.round(downloadProgress[file.id])}%
                      </span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onDownload(file.id)}
                      className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm shrink-0"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Download</span>
                      <span className="xs:hidden">Get</span>
                    </Button>
                  )
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled
                    className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm shrink-0"
                  >
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span>Locked</span>
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 sm:py-8">
            <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-2 sm:mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground">
              No files available for this product
            </p>
          </div>
        )}

        {/* Summary Footer */}
        {product.files?.length > 0 && (
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
              <span>
                {product.files.length} file{product.files.length !== 1 ? 's' : ''} total
              </span>
              {isPurchased && (
                <span className="font-medium text-green-700">
                  ✓ Full access granted
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
