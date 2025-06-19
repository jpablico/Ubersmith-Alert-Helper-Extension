# Ubersmith Alert Helper Extension

A Chrome extension designed to assist data center technicians in managing high-volume alert storms in Ubersmith by:

- Highlighting critical keywords in tickets
- Filtering out known low-priority or redundant alerts
- Guiding users through a streamlined multi-step validation before closing tickets

Built to reduce alert fatigue and improve clarity during incident escalations.

## Key Features

- Regex-based keyword highlighting
- Simple toggle-based filters
- Step-by-step UI to prevent accidental mass closure

## Tech Stack

- JavaScript
- Chrome Extensions API (Manifest v3)
- Regex + DOM manipulation

## Use Case

Developed to support NOC techs during alert floods where hundreds of low-priority tickets can obscure real issues. This tool helps triage and manage responses more efficiently without sacrificing accuracy or accountability.

