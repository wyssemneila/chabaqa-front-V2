"use client"

import { Button } from "@/components/ui/button"
import { Play, Sparkles, ArrowRight, Users, DollarSign, TrendingUp } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-white overflow-hidden">
      {/* Simplified Gradient Spots */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-32 left-16 w-80 h-80 bg-gradient-to-br from-chabaqa-primary/20 to-chabaqa-secondary1/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-16 w-96 h-96 bg-gradient-to-br from-chabaqa-secondary2/15 to-chabaqa-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Simple Creator Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-chabaqa-primary/10 rounded-full border border-chabaqa-primary/20">
            <Sparkles className="w-4 h-4 text-chabaqa-primary mr-2" />
            <span className="text-sm font-medium text-chabaqa-primary">For Creators, By Creators</span>
          </div>

          {/* Simplified Headline */}
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Build Your{" "}
              <span className="bg-gradient-to-r from-chabaqa-primary to-chabaqa-secondary1 bg-clip-text text-transparent">
                Dream Community
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Create, engage, and monetize your audience with the platform designed for creators who want to{" "}
              <span className="font-semibold text-chabaqa-primary">build something amazing</span>.
            </p>
          </div>

          {/* Simple CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-chabaqa-accent hover:bg-chabaqa-accent/90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
              onClick={() => window.open("#pricing", "_self")}
            >
              Start Building Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-chabaqa-primary text-chabaqa-primary hover:bg-chabaqa-primary hover:text-white px-8 py-4 text-lg font-semibold bg-white/80 backdrop-blur-sm transition-all duration-300"
              onClick={() => window.open("#success-stories", "_self")}
            >
              <Play className="w-5 h-5 mr-2" />
              See Success Stories
            </Button>
          </div>

          {/* Simple Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-chabaqa-primary to-chabaqa-secondary1 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">10K+</div>
              <div className="text-sm text-gray-600">Active Creators</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-chabaqa-secondary2 to-chabaqa-accent rounded-2xl flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">$2M+</div>
              <div className="text-sm text-gray-600">Creator Earnings</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-chabaqa-secondary1 to-chabaqa-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>

          {/* Simple Creator Types */}
          <div className="flex flex-wrap justify-center gap-3 pt-8">
            <span className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium border border-gray-200 hover:border-chabaqa-primary hover:text-chabaqa-primary transition-colors cursor-pointer">
              Content Creators
            </span>
            <span className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium border border-gray-200 hover:border-chabaqa-primary hover:text-chabaqa-primary transition-colors cursor-pointer">
              Educators
            </span>
            <span className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium border border-gray-200 hover:border-chabaqa-primary hover:text-chabaqa-primary transition-colors cursor-pointer">
              Coaches
            </span>
            <span className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium border border-gray-200 hover:border-chabaqa-primary hover:text-chabaqa-primary transition-colors cursor-pointer">
              Community Leaders
            </span>
          </div>

          {/* Simple Trust Indicator */}
          <div className="pt-8">
            <p className="text-sm text-gray-500 mb-4">Trusted by creators worldwide</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="w-24 h-8 bg-gray-300 rounded"></div>
              <div className="w-24 h-8 bg-gray-300 rounded"></div>
              <div className="w-24 h-8 bg-gray-300 rounded"></div>
              <div className="w-24 h-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
