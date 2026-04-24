import { Card, CardContent } from "@/components/ui/card"
import { Users, Zap, Heart } from "lucide-react"
import { CommunitiesCTAClient } from "@/components/communities/communities-cta-client"

export function CommunitiesCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-chabaqa-primary/10 via-white to-chabaqa-secondary1/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 text-white overflow-hidden">
            <CardContent className="p-12 text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-bold">Ready to Start Your Own Community?</h2>
                <p className="text-xl opacity-90 max-w-2xl mx-auto">
                  Join thousands of creators who are building thriving communities and generating meaningful income with
                  Chabaqa.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 my-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2">Build Community</h3>
                  <p className="text-sm opacity-80">Create your space and invite members</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2">Engage & Grow</h3>
                  <p className="text-sm opacity-80">Share content and host live events</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-2">Monetize</h3>
                  <p className="text-sm opacity-80">Generate revenue from your expertise</p>
                </div>
              </div>

              <CommunitiesCTAClient />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
