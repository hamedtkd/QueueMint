import { BrainCircuit, KeyRound, Save, ShieldCheck, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DEFAULT_SMART_ASSISTANT_SETTINGS,
  loadSmartAssistantSettings,
  saveSmartAssistantSettings,
  type SmartAssistantProvider,
  type SmartAssistantSettings,
} from "@/lib/smart-assistant"
import type { AppLocale } from "@/types"

function text(locale: AppLocale) {
  return locale === "fa" ? {
    title: "Smart Assistant", hint: "هوش مصنوعی اختیاری است. بدون تنظیم این بخش، Smart Draft محلی همچنان کار می‌کند.",
    provider: "حالت", local: "فقط محلی", openai: "OpenAI API", model: "مدل", key: "API key", save: "ذخیره تنظیمات",
    clear: "پاک کردن کلید", saved: "تنظیمات Smart Assistant ذخیره شد", cleared: "کلید API پاک شد",
    privacy: "کلید فقط در حافظه نشست افزونه نگه داشته می‌شود و با بستن کامل مرورگر پاک می‌شود. هیچ داده‌ای تا زمانی که خودت Generate را نزنی ارسال نمی‌شود.",
  } : {
    title: "Smart Assistant", hint: "AI is optional. Local Smart Draft keeps working when this is not configured.",
    provider: "Mode", local: "Local only", openai: "OpenAI API", model: "Model", key: "API key", save: "Save settings",
    clear: "Clear key", saved: "Smart Assistant settings saved", cleared: "API key cleared",
    privacy: "The key is kept only in extension session storage and is cleared after the browser fully exits. No data is sent until you explicitly click Generate.",
  }
}

export function SmartAssistantSettingsPanel({ locale }: { locale: AppLocale }) {
  const tx = text(locale)
  const [settings, setSettings] = useState<SmartAssistantSettings>(DEFAULT_SMART_ASSISTANT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void loadSmartAssistantSettings().then((value) => { if (!cancelled) { setSettings(value); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  async function save() {
    await saveSmartAssistantSettings({ ...settings, model: settings.model.trim() || DEFAULT_SMART_ASSISTANT_SETTINGS.model, apiKey: settings.apiKey.trim() })
    toast.success(tx.saved)
  }

  async function clearKey() {
    const next = { ...settings, apiKey: "" }
    setSettings(next); await saveSmartAssistantSettings(next); toast.success(tx.cleared)
  }

  return (
    <section>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium"><BrainCircuit className="size-4 text-muted-foreground" />{tx.title}</div>
      <div className="rounded-xl border bg-muted/10 p-3.5">
        <p className="text-xs leading-5 text-muted-foreground">{tx.hint}</p>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1.5 text-xs font-medium"><span>{tx.provider}</span><Select value={settings.provider} onValueChange={(value) => setSettings((current) => ({ ...current, provider: value as SmartAssistantProvider }))} disabled={loading}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="local">{tx.local}</SelectItem><SelectItem value="openai">{tx.openai}</SelectItem></SelectContent></Select></label>
          {settings.provider === "openai" ? <>
            <label className="grid gap-1.5 text-xs font-medium"><span>{tx.model}</span><Input value={settings.model} onChange={(event) => setSettings((current) => ({ ...current, model: event.target.value }))} placeholder={DEFAULT_SMART_ASSISTANT_SETTINGS.model} autoComplete="off" /></label>
            <label className="grid gap-1.5 text-xs font-medium"><span className="flex items-center gap-1.5"><KeyRound className="size-3.5" />{tx.key}</span><Input type="password" value={settings.apiKey} onChange={(event) => setSettings((current) => ({ ...current, apiKey: event.target.value }))} placeholder="sk-..." autoComplete="off" /></label>
          </> : null}
          <div className="flex items-start gap-2 rounded-lg border bg-background p-2.5 text-[11px] leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" /><span>{tx.privacy}</span></div>
          <div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => void save()} disabled={loading}><Save className="size-3.5" />{tx.save}</Button>{settings.apiKey ? <Button type="button" variant="outline" size="sm" onClick={() => void clearKey()}><Trash2 className="size-3.5" />{tx.clear}</Button> : null}</div>
        </div>
      </div>
    </section>
  )
}
