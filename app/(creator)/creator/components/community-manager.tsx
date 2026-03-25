import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Settings, ExternalLink, Edit } from "lucide-react"
import Link from "next/link"
import { Community } from "@/lib/models"

interface CommunityManagerProps {
  communities: Community[]
}

export function CommunityManager({ communities }: CommunityManagerProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Communities</span>
          <Button className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white">
            Create New Community
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {communities.map((community) => (
            <div
              key={community.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={
                    community.logo ||
                    community.image ||
                    community.coverImage ||
                    "/placeholder.svg?height=64&width=64&text=Community"
                  }
                  alt={community.name}
                  className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                  loading="lazy"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{community.name}</h3>
                    {community.verified && <Badge className="bg-blue-100 text-blue-800 text-xs">Verified</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{community.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-1" />
                        {typeof community.members === 'number' ? community.members.toLocaleString() : '0'}members
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {community.category}
                    </Badge>
                    <Badge
                      className={
                        community.priceType === "free"
                          ? "bg-green-100 text-green-800"
                          : "bg-chabaqa-primary/10 text-chabaqa-primary"
                      }
                    >
                      {community.priceType === "free" ? "Free" : `${community.price} TND/mo`}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Link href={`/community/${community.slug}`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </Link>
                <Link href={`/creator/community/${community.slug}/customize`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                </Link>

              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
