# CMMS Web MVP — design system (keep consistent)
- All UI in English. Target 1440×900 desktop.
- Shell: TopBar.dc.html (56px, #34050D) + Sidebar.dc.html (232px, #34050D, prop `active`). Each screen = own DC file importing both.
- Font: IBM Plex Sans (UI), IBM Plex Mono (IDs/codes). Icons: Material Symbols Outlined via font (inline `font:20px/1 'Material Symbols Outlined'`).
- Colors: accent #C00018 (primary CTA, active tab underline), bg #F6F7F9, surface #FFF, border #E4E7EC, text #1E2430, text-2 #667085, text-3 #98A2B3, success #0B6B4A, info #2456B8, warning #B54708, critical #B42318.
- Priority badges: Critical solid #C00018/#fff · High #FDECEC/#B42318 · Medium #FEF3E2/#B54708 · Low #EEF1F4/#475467.
- Status badges (dot + label): Overdue #FDECEC/#B42318 · Scheduled #EAF1FD/#2456B8 · In progress #E6F4EE/#0B6B4A · Waiting for parts #FEF3E2/#B54708 · Completed #EEF1F4/#475467.
- Panels: white, 1px #E4E7EC, radius 8, no shadow. Panel header 14px/600, "View all" link right in #C00018.
- Buttons 34px high, radius 6. Primary red; secondary white w/ border. Page title 22px/600 + 13px subtitle.
- Terminology: Work order (WO-xxxxxxx), Maintenance plans, Checklists, Planning, Spare parts, Documents, Teams & Users, Administration.
