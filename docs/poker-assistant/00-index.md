---
title: "Poker Assistant App - Project Index"
type: index
status: draft
area: projects
created: 2026-03-05
updated: 2026-03-05
tags: [poker, gto, mobile-app, llm, side-project]
related: []
---

# Poker Assistant App

A mobile-first, conversational GTO poker assistant powered by precomputed solver data and a Claude LLM interpretation layer. The app lets you describe poker situations in plain English and get accurate, solver-backed advice with natural language explanations.

## Key Differentiators

- **Natural language interface** — describe hands in plain English, not range matrices
- **Mobile-first** — designed for phone use at breaks, post-session, and study
- **Tournament-focused** — ICM, bubble play, push/fold, pay jumps
- **Affordable** — targeting recreational players priced out of GTO Wizard ($39-206/mo)
- **LLM interpretation layer** — Claude provides qualitative analysis on top of quantitative GTO data

## Project Notes

### Core Concept
- [[01-vision]] — Vision, goals, and what this app is

### Technical Architecture
- [[02-architecture]] — System architecture overview
- [[03-gto-engine]] — GTO computation layer (precomputed + runtime)
- [[04-llm-rag-layer]] — LLM/RAG interpretation and coaching layer
- [[10-data-model]] — Data structures, storage, and schemas

### Product Design
- [[05-cross-platform-mobile]] — Cross-platform mobile strategy
- [[06-ux-design]] — User interface, flows, and interaction patterns

### Strategy & Planning
- [[07-mako-poker-assessment]] — Reusable assets from Mako Poker
- [[08-competitor-analysis]] — GTO Wizard, PioSolver, market gaps
- [[09-mvp-definition]] — MVP scope, phased roadmap
- [[11-tournament-gto]] — Tournament-specific GTO considerations

### Research
- [[12-research-topics]] — Open questions and things to investigate

## Quick Reference

| Aspect | Decision |
|--------|----------|
| Platform | Cross-platform (iOS + Android) |
| Poker variant | NLHE first, expand later |
| Game type | Tournaments first, then cash |
| LLM provider | Claude (Anthropic) |
| Offline support | Not required for MVP |
| Scope | Side project, iterate slowly |
| Existing codebase | [Mako Poker](https://github.com/JohnHuffman824/mako-poker) |

## Status

**Phase: Brainstorming / Design**

Currently fleshing out the idea, architecture, and MVP scope. No code written for the mobile app yet. The [[07-mako-poker-assessment|Mako Poker]] codebase provides a significant head start on the poker engine and solver.
