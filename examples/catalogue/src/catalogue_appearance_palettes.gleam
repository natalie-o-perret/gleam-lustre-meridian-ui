import meridian_ui/select_button.{Choice}

pub fn primary() {
  [
    Choice("mono", "Monochrome", False),
    Choice("", "Meridian", False),
    Choice("#10b981", "Emerald", False),
    Choice("#22c55e", "Green", False),
    Choice("#84cc16", "Lime", False),
    Choice("#f97316", "Orange", False),
    Choice("#f59e0b", "Amber", False),
    Choice("#eab308", "Yellow", False),
    Choice("#14b8a6", "Teal", False),
    Choice("#06b6d4", "Cyan", False),
    Choice("#0ea5e9", "Sky", False),
    Choice("#3b82f6", "Blue", False),
    Choice("#6366f1", "Indigo", False),
    Choice("#8b5cf6", "Violet", False),
    Choice("#a855f7", "Purple", False),
    Choice("#d946ef", "Fuchsia", False),
    Choice("#ec4899", "Pink", False),
    Choice("#f43f5e", "Rose", False),
  ]
}

pub fn surface() {
  [
    Choice("", "Default", False),
    Choice("#64748b", "Slate", False),
    Choice("#6b7280", "Gray", False),
    Choice("#71717a", "Zinc", False),
    Choice("#737373", "Neutral", False),
    Choice("#78716c", "Stone", False),
    Choice("#8b8589", "Taupe", False),
    Choice("#8e7c86", "Mauve", False),
    Choice("#687c71", "Sage", False),
  ]
}
