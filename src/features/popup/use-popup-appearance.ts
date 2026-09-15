import { useEffect, useState } from "react"

import { loadState, saveState } from "@/lib/storage"
import type { AppLocale, AppTheme, DensityMode, RadiusMode } from "@/types"

function foregroundForHex(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) return "#ffffff"
  const value = Number.parseInt(match[1], 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  const srgb = channels.map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? "#ffffff" : "#111827"
}

function accentForDarkMode(hex: string) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!match) return hex
  const value = Number.parseInt(match[1], 16)
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
  const mixed = channels.map((channel) => Math.round(channel + (255 - channel) * 0.2))
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
}

async function persistAppearance(patch: { locale?: AppLocale; theme?: AppTheme }) {
  const current = await loadState()
  await saveState({ ...current, ...patch })
}

export function usePopupAppearance() {
  const [locale, setLocaleState] = useState<AppLocale>("en")
  const [theme, setThemeState] = useState<AppTheme>("system")
  const [accentColor, setAccentColor] = useState("#087b61")
  const [density, setDensity] = useState<DensityMode>("comfortable")
  const [radius, setRadius] = useState<RadiusMode>("medium")
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    void loadState().then((state) => {
      if (state.locale) setLocaleState(state.locale)
      if (state.theme) setThemeState(state.theme)
      if (state.accentColor) setAccentColor(state.accentColor)
      if (state.density) setDensity(state.density)
      if (state.radius) setRadius(state.radius)
    })
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches)
      const effectiveAccent = dark ? accentForDarkMode(accentColor) : accentColor
      setIsDark(dark)
      document.documentElement.classList.toggle("dark", dark)
      document.documentElement.style.setProperty("--primary", effectiveAccent)
      document.documentElement.style.setProperty("--ring", effectiveAccent)
      document.documentElement.style.setProperty("--primary-foreground", foregroundForHex(effectiveAccent))
    }
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [theme, accentColor])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === "fa" ? "rtl" : "ltr"
    document.documentElement.dataset.density = density
    document.documentElement.dataset.radius = radius
  }, [locale, density, radius])

  function setLocale(next: AppLocale) {
    setLocaleState(next)
    void persistAppearance({ locale: next })
  }

  function setTheme(next: AppTheme) {
    setThemeState(next)
    void persistAppearance({ theme: next })
  }

  function toggleLocale() {
    setLocale(locale === "en" ? "fa" : "en")
  }

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark")
  }

  return { locale, theme, isDark, setLocale, setTheme, toggleLocale, toggleTheme }
}
