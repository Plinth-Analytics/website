---
author: null
category: "Case Study"
blogImage:
  src: "../../assets/webflow/67630084d95702b171e3c28e_image.png"
  alt: null
  webflowFileId: "67630084d95702b171e3c28e"
shortDescription: null
mainStory: false
orderNumber: null
slug: "scaling-real-world-evidence-generation-across-diverse-datasets"
title: "Scaling Real-World Evidence Generation across Diverse Datasets"
status:
  isDraft: false
  isArchived: false
  published: true
webflowId: "6763008ef0a1c085302d3638"
createdOn: "2024-12-18T17:04:14.368Z"
lastUpdated: "2024-12-18T17:04:14.368Z"
lastPublished: "2024-12-18T17:44:39.440Z"
---

### Cohort builder tricks to support applying the same framework to multiple datasets (different data models, and/or data providers)

#### Motivation

Using the same cohort-building tools across multiple datasets allows scientific teams to generate real-world evidence at scale — whether they are harmonizing data from the same patients across several sources to deliver rich insights, or replicating cohorts across data providers to enhance generalizability. However, it can be challenging for tools to support multiple datasets due to variance in coding schemes, data collection processes, and data models.

#### Solution

**Plinth has employed several strategies to scale cohort-building workflows across datasets, depending on the data sources of interest and the desired use case.** These include building tools that consume a standard data model across data providers (such as the [OMOP Common Data Model](https://www.ohdsi.org/data-standardization/)); leveraging object-oriented programming to deliver “multilingual” cohort-building tools compatible with multiple data models; and developing transformer software to harmonize data from several sources into a single model ahead of cohort creation. All of these solutions enable **reuse and standardization of cohort definitions across datasets, elevating productivity while unlocking the power of multiple evidence sources.**

#### Impact

**Plinth’s solutions allow real-world evidence generation teams to efficiently boost the generalizability and depth of their findings by sharing cohort-building workflows across diverse datasets. Our user-friendly cohort-building tools have driven significant reductions in time spent onboarding into new datasets, powering fast and reliable insights at scale.**
