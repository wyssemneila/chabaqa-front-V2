"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Beaker,
  Loader2,
  RefreshCw,
  FileText,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { creatorAnalyticsApi, type CreatorInsightsResponse } from "@/lib/api/creator-analytics.api";

interface AIInsightsPanelProps {
  contentType: string;
  contentId: string;
  communityId?: string;
  /** Optional caller-controlled date range ISO strings */
  from?: string;
  to?: string;
  /** Plan tier string for access-gating */
  plan?: string;
}

const DEFAULT_DAYS = 30;

const getDateRange = (fromProp?: string, toProp?: string) => {
  if (fromProp && toProp) return { from: fromProp, to: toProp };
  const now = new Date();
  const past = new Date(now.getTime() - DEFAULT_DAYS * 24 * 60 * 60 * 1000);
  return {
    from: past.toISOString(),
    to: now.toISOString(),
  };
};

const stripMarkdown = (text: string): string => {
  return text
    .replace(/```[a-z]*\n?/gi, '')   // remove code fences like ```json
    .replace(/```/g, '')              // remove closing fences
    .replace(/^#+\s+/gm, '')         // remove heading markers
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
    .trim();
};

const confidenceColor = (c: string) => {
  if (c === "high") return "bg-green-100 text-green-700 border-green-300";
  if (c === "med") return "bg-yellow-100 text-yellow-700 border-yellow-300";
  return "bg-gray-100 text-gray-600 border-gray-300";
};

const targetLabel = (t: string) => {
  if (t === "intro") return "Intro";
  if (t === "cta") return "CTA";
  if (t === "structure") return "Structure";
  return t;
};

export function AIInsightsPanel({
  contentType,
  contentId,
  communityId,
  from: fromProp,
  to: toProp,
  plan,
}: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<CreatorInsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = getDateRange(fromProp, toProp);
      const res = await creatorAnalyticsApi.generateInsights({
        contentType: contentType as any,
        contentId,
        from,
        to,
        communityId,
      });
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? null;
      if (data) {
        setInsights(data as CreatorInsightsResponse);
      } else {
        setError("No insights returned. Please try again.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  // Basic plan gating: require growth or pro
  const isGated = plan !== undefined && plan !== "growth" && plan !== "pro";

  if (isGated) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">AI Insights available on Growth plan and above</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--p)]" />
          AI Creator Insights
        </CardTitle>
        <div className="flex gap-2">
          {insights && (
            <Button
              onClick={handleGenerate}
              disabled={loading}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <><RefreshCw className="h-3 w-3 mr-1" />Regenerate</>
              )}
            </Button>
          )}
          {!insights && (
            <Button
              onClick={handleGenerate}
              disabled={loading}
              size="sm"
              className="bg-[var(--p)] hover:bg-[var(--p-dark)] text-white"
            >
              {loading ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Analyzing...</>
              ) : (
                "Generate Insights"
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && !insights && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--p)]" />
            <p className="text-sm">Analyzing your content performance with AI...</p>
          </div>
        )}

        {insights && (
          <div className="space-y-4">
            {insights.warnings && insights.warnings.length > 0 && (
              <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-lg p-3">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <ul className="space-y-1">
                  {insights.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <Tabs defaultValue="summary">
              <TabsList className="grid grid-cols-5 h-9">
                <TabsTrigger value="summary" className="text-xs px-1 gap-1">
                  <FileText className="h-3 w-3" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="issues" className="text-xs px-1 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Issues
                  {insights.topIssues.length > 0 && (
                    <span className="bg-orange-100 text-orange-700 rounded-full px-1.5 text-[10px] leading-4">
                      {insights.topIssues.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="fixes" className="text-xs px-1 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Fixes
                  {insights.fixes.length > 0 && (
                    <span className="bg-green-100 text-green-700 rounded-full px-1.5 text-[10px] leading-4">
                      {insights.fixes.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rewrites" className="text-xs px-1 gap-1">
                  <Pencil className="h-3 w-3" />
                  Rewrites
                  {(insights.rewriteSuggestions?.length ?? 0) > 0 && (
                    <span className="bg-blue-100 text-blue-700 rounded-full px-1.5 text-[10px] leading-4">
                      {insights.rewriteSuggestions.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="experiments" className="text-xs px-1 gap-1">
                  <Beaker className="h-3 w-3" />
                  Experiments
                  {insights.experiments.length > 0 && (
                    <span className="bg-purple-100 text-purple-700 rounded-full px-1.5 text-[10px] leading-4">
                      {insights.experiments.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ── SUMMARY ─────────────────────────────────────────── */}
              <TabsContent value="summary" className="mt-4">
                {insights.summary ? (
                  <div className="space-y-3">
                    {stripMarkdown(insights.summary).split(/\n\n+/).map((para, i) => (
                      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No summary available.</p>
                )}
              </TabsContent>

              {/* ── ISSUES ──────────────────────────────────────────── */}
              <TabsContent value="issues" className="mt-4">
                {insights.topIssues.length > 0 ? (
                  <div className="space-y-3">
                    {insights.topIssues.map((issue, idx) => (
                      <div key={idx} className="border rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm">{issue.stepTitle || issue.stepId}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${confidenceColor(issue.confidence)}`}
                          >
                            {issue.confidence} confidence
                          </Badge>
                        </div>
                        {issue.metricEvidence && issue.metricEvidence.length > 0 && (
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {issue.metricEvidence.map((e, ei) => (
                              <li key={ei} className="flex items-start gap-1.5">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0" />
                                {e}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className="text-xs text-muted-foreground leading-relaxed border-t pt-2">
                          {stripMarkdown(issue.hypothesis)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No issues detected.</p>
                )}
              </TabsContent>

              {/* ── FIXES ───────────────────────────────────────────── */}
              <TabsContent value="fixes" className="mt-4">
                {insights.fixes.length > 0 ? (
                  <div className="space-y-3">
                    {insights.fixes.map((fix, idx) => (
                      <div key={idx} className="border rounded-xl p-4 space-y-2">
                        <p className="font-medium text-sm">{fix.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{stripMarkdown(fix.whyItHelps)}</p>
                        <div className="bg-[var(--bg)] rounded-lg p-2.5 text-xs text-[var(--t1)] border">
                          <span className="font-medium text-[var(--p)]">Action: </span>
                          {fix.exactCreatorAction}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600 font-medium">
                            Expected lift: {fix.expectedMetricLift}
                          </span>
                          {fix.risk && (
                            <span className="text-muted-foreground">Risk: {fix.risk}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No fix recommendations available.</p>
                )}
              </TabsContent>

              {/* ── REWRITES ────────────────────────────────────────── */}
              <TabsContent value="rewrites" className="mt-4">
                {insights.rewriteSuggestions && insights.rewriteSuggestions.length > 0 ? (
                  <div className="space-y-3">
                    {insights.rewriteSuggestions.map((rw, idx) => (
                      <div key={idx} className="border rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 capitalize"
                          >
                            {targetLabel(rw.target)}
                          </Badge>
                          {rw.stepId && (
                            <span className="text-xs text-muted-foreground">Step: {rw.stepId}</span>
                          )}
                        </div>
                        <div className="bg-[var(--bg)] rounded-lg p-3 border text-sm text-[var(--t1)] leading-relaxed whitespace-pre-wrap">
                          {rw.text}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No rewrite suggestions generated.</p>
                )}
              </TabsContent>

              {/* ── EXPERIMENTS ─────────────────────────────────────── */}
              <TabsContent value="experiments" className="mt-4">
                {insights.experiments.length > 0 ? (
                  <div className="space-y-3">
                    {insights.experiments.map((exp, idx) => (
                      <div key={idx} className="border rounded-xl p-4 space-y-3">
                        <p className="font-medium text-sm">{exp.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[var(--bg)] rounded-lg p-2.5 border text-xs">
                            <p className="text-[var(--p)] font-medium mb-1">Variant A</p>
                            <p className="text-[var(--t2)] leading-relaxed">{exp.variantA}</p>
                          </div>
                          <div className="bg-[var(--bg)] rounded-lg p-2.5 border text-xs">
                            <p className="text-purple-600 font-medium mb-1">Variant B</p>
                            <p className="text-[var(--t2)] leading-relaxed">{exp.variantB}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            <span className="font-medium text-[var(--t1)]">Metric: </span>
                            {exp.successMetric}
                          </span>
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5">
                            {exp.runForDays} days
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No experiments suggested.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!insights && !loading && !error && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click &ldquo;Generate Insights&rdquo; to get AI-powered analysis of this content&apos;s performance
          </p>
        )}
      </CardContent>
    </Card>
  );
}
