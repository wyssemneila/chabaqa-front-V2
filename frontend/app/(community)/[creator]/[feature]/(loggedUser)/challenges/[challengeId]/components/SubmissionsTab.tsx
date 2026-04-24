import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Star, ExternalLink, MessageCircle, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface SubmissionsTabProps {
  challengeTasks: any[]
  submissions: any[]
  submissionByTaskId: Record<string, any>
}

export default function SubmissionsTab({ challengeTasks, submissions, submissionByTaskId }: SubmissionsTabProps) {

  // Get all submitted tasks (either isCompleted flag OR has a submission record)
  const submittedTasks = challengeTasks.filter(task => {
    return task.isCompleted || Boolean(submissionByTaskId[String(task.id)])
  })

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>My Submissions</CardTitle>
        <CardDescription>Review your completed projects and feedback ({submissions.length})</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submittedTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You haven&apos;t submitted any projects yet.
            </div>
          ) : (
            submittedTasks.map((task) => {
                const submission = submissionByTaskId[String(task.id)]
                const isCompleted = task.isCompleted || (submission && submission.status === 'approved');
                
                return (
                  <div
                    key={task.id}
                    className="flex flex-col space-y-4 p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          Day {task.day}: {task.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{task.deliverable}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-500">{task.points} pts</Badge>
                        <Badge variant="outline" className="capitalize">
                          {submission?.status || (isCompleted ? 'completed' : 'pending')}
                        </Badge>
                      </div>
                    </div>
                    
                    {submission && (
                      <div className="pl-14 space-y-3">
                        {submission.content && (
                          <div className="text-sm text-gray-700 bg-white/50 p-3 rounded-md italic">
                            &quot;{submission.content}&quot;
                          </div>
                        )}
                        
                        {/* Display uploaded photos */}
                        {submission.files && submission.files.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {submission.files.map((file: string, i: number) => (
                              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-white group cursor-pointer" onClick={() => window.open(file, '_blank')}>
                                <Image
                                  src={file}
                                  alt={`Submission photo ${i + 1}`}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {submission.links && submission.links.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {submission.links.map((link: string, i: number) => (
                              <a 
                                key={i} 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {new URL(link).hostname}
                              </a>
                            ))}
                          </div>
                        )}

                        {submission.feedback && (
                          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                            <div className="flex items-center text-sm font-semibold text-yellow-800 mb-1">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Feedback from Reviewer
                            </div>
                            <p className="text-sm text-yellow-700">{submission.feedback}</p>
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground">
                          Submitted {new Date(submission.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
