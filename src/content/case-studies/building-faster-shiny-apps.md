---
author: null
category: "Case Study"
blogImage:
  src: "../../assets/webflow/684b28c79002faf65daab2ec_dynamic-pipeline.png"
  alt: null
  webflowFileId: "684b28c79002faf65daab2ec"
shortDescription: null
mainStory: false
orderNumber: null
slug: "building-faster-shiny-apps"
title: "Building faster SHINY apps"
status:
  isDraft: false
  isArchived: false
  published: true
webflowId: "684b2219d20bac037fe4eb8f"
createdOn: "2025-06-12T18:53:13.956Z"
lastUpdated: "2025-06-12T19:21:47.060Z"
lastPublished: "2025-06-12T19:21:47.060Z"
---

## Pipeline + Shiny App pattern to allow for data reuse, and faster shiny app.

### Motivation

Healthcare research organizations often struggle with slow, resource-intensive web applications that must repeatedly process the same data for diverse stakeholders. **Traditional approaches force applications to re-compute analyses on-demand, creating bottlenecks that delay critical insights and frustrate users seeking real-time access to complex healthcare analytics.**

### Solution

Plinth's solution leverages a **pipeline + web app architecture pattern that separates data processing from data presentation**. We build robust data pipelines that pre-compute analyses and store results in optimized formats, while creating lightweight web applications that instantly serve these pre-processed insights. **This separation enables data reuse across multiple applications, dramatically improves performance, and allows stakeholders to explore complex healthcare datasets without waiting for computations to complete.**

### Impact

**Our pipeline + web app pattern has enabled healthcare organizations to deliver sub-second response times for complex analyses that previously took minutes to compute.** For example, we helped one organization reduce their HEOR dashboard load times from over 30 seconds to under 2 seconds while supporting analysis of over 25 healthcare variables across infinite possible cohort combinations. **By enabling faster access to insights, research teams can make data-driven decisions in real-time, accelerating the pace of healthcare innovation and improving patient outcomes.**
