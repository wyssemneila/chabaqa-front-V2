"use client"
import { useState } from 'react'
import { Sparkles, Loader2, WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { creatorWritingApi, type CreatorWritingAction, type CreatorWritingField, type CreatorWritingSurface, type CreatorWritingTone } from '@/lib/api/creator-writing.api'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'

export function CreatorWritingAssist({ value, onApply, surface, field, context, maxCharacters=1200, disabled=false }:{ value:string; onApply:(text:string)=>void; surface:CreatorWritingSurface; field:CreatorWritingField; context:string; maxCharacters?:number; disabled?:boolean }) {
  const { selectedCommunityId } = useCreatorCommunity()
  const [open,setOpen]=useState(false), [loading,setLoading]=useState(false), [error,setError]=useState(''), [result,setResult]=useState('')
  const [action,setAction]=useState<CreatorWritingAction>(value.trim()?'improve':'generate'), [tone,setTone]=useState<CreatorWritingTone>('professional')
  const generate=async()=>{ if(!selectedCommunityId)return; setLoading(true);setError('');try{const r=await creatorWritingApi.generate(selectedCommunityId,{contentType:surface,field,action,tone,language:'en',context,currentValue:value,maxCharacters});setResult(r.content)}catch(e:any){setError(e?.message||'Unable to generate writing right now.')}finally{setLoading(false)} }
  return <>
    <Button type="button" variant="ghost" size="sm" disabled={disabled||!selectedCommunityId} onClick={()=>{setOpen(true);setResult('');setError('')}} className="h-7 gap-1.5 px-2 text-[11px] font-bold text-[var(--p)] hover:bg-[var(--p2)]"><Sparkles className="h-3.5 w-3.5"/>Write with AI</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--p2)] text-[var(--p)]"><WandSparkles className="h-5 w-5"/></div><DialogTitle>Writing Assistant</DialogTitle><DialogDescription>Generate or refine this field. Nothing is applied until you approve it.</DialogDescription></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2"><Select value={action} onValueChange={v=>setAction(v as CreatorWritingAction)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['generate','improve','rewrite','shorten','expand'].map(v=><SelectItem key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</SelectItem>)}</SelectContent></Select><Select value={tone} onValueChange={v=>setTone(v as CreatorWritingTone)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['professional','friendly','inspiring','educational','persuasive','concise'].map(v=><SelectItem key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</SelectItem>)}</SelectContent></Select></div>
      {result?<div className="rounded-xl border bg-muted/40 p-4 text-sm leading-6 whitespace-pre-wrap">{result}</div>:<div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Choose an action and tone, then generate a suggestion.</div>}
      {error&&<div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button type="button" onClick={()=>void generate()} disabled={loading}>{loading?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Sparkles className="mr-2 h-4 w-4"/>}{result?'Generate again':'Generate'}</Button>{result&&<Button type="button" onClick={()=>{onApply(result);setOpen(false)}}>Apply suggestion</Button>}</div>
    </DialogContent></Dialog>
  </>
}
