# FD Investment Platform Documentation

## Welcome

This repository contains the complete architecture and implementation documentation for the FD Investment Platform.

Before implementing any feature, read the following documents.

---

## Engineering Blueprint

01 Product Architecture

02 Technology Architecture

03 Information Architecture

04 Navigation Architecture

05 Layout Architecture

06 Design System Architecture

07 Component Architecture

08 Folder Structure

09 State Management

10 API Architecture

11 Mock API Strategy

12 Coding Standards

13 Performance Strategy

14 Accessibility Standards

15 Security Principles

16 AI Strategy

---

## Module Contracts

Binding alongside Documents 01–16. These record decisions taken during
implementation that the blueprint could not anticipate, and they are the
source of truth for the Marketplace module.

| Document | Governs |
|---|---|
| `engineering/marketplace-url-state.md` | URL state, the writers, invariants I1–I8 |
| `engineering/marketplace-compare-state.md` | The compare selection: ownership, the cap, and which of the URL or the store is authoritative per route |
| `engineering/marketplace-home-query-strategy.md` | Query keys and fetch strategy on Home |
| `engineering/design-tokens.md` | Tokens — no colour or spacing is written literally |
| `engineering/component-library.md` | The design-system primitives that exist |

---

## Approved UI

FD Investment Platform - Marketplace Home

FD Investment Platform - Product Details

FD Investment Platform - Comparison

These designs are the implementation source of truth.

---

## Current Task

Always read:

docs/development/current-task.md

before implementing anything.

---

## Rule

Never introduce new architecture without approval.

Always reuse existing components.

Always follow the Design System.