"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReactNode } from "react"

interface CourseTabsProps {
  activeTab: string
  onTabChange: (value: string) => void
  children: ReactNode
}

export function CourseTabs({ activeTab, onTabChange, children }: CourseTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList>
        <TabsTrigger value="details">Course Details</TabsTrigger>
        <TabsTrigger value="content">Content Management</TabsTrigger>
        <TabsTrigger value="pricing">Pricing & Access</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}