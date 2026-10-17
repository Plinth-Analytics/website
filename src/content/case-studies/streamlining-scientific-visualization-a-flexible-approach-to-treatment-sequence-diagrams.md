---
author: null
category: "Case Study"
blogImage:
  src: "../../assets/webflow/6762f9616a079d8a95797d71_newplot.png"
  alt: null
  webflowFileId: "6762f9616a079d8a95797d71"
shortDescription: null
mainStory: false
orderNumber: null
slug: "streamlining-scientific-visualization-a-flexible-approach-to-treatment-sequence-diagrams"
title: "Streamlining Scientific Visualization: A Flexible Approach to Treatment Sequence Diagrams"
status:
  isDraft: false
  isArchived: false
  published: true
webflowId: "67630130809f894cf5aa0029"
createdOn: "2024-12-18T17:06:56.049Z"
lastUpdated: "2024-12-18T22:37:10.142Z"
lastPublished: "2024-12-18T22:37:10.142Z"
---

### Developing the ability to generate Sankey plots in both HTML and PDF format

#### Motivation

Sankey diagrams of treatment sequences allow key decision-makers to easily understand the patient journey, so that they are better enabled to improve treatment effectiveness and access for patients across various disease stages. Producing and understanding these diagrams, however, can be challenging. Interactive Sankey diagrams look polished on a web page, and enable a better exploration experience, but hamper analytic partners who prefer, or are constrained to, collaborating using Microsoft Word documents, Google Docs, or PDFs. Generating versions of the same figure in multiple formats can be costly to build and maintain long-term, and fiddling with the low-level mechanics of each plot can take valuable researcher time away from the science behind it.

#### Solution

Extending further, interaction isn’t only a hurdle for Sankey diagrams, but rather for a diverse set of analytic graphs. Development of a context-aware plotting function would address a wide array of issues. To this end, Plinth applied its flexible data plotting methodology to develop **a reusable, user-friendly R function. Among other fixes, this function creates a Sankey diagram from a treatment sequence table, automatically outputting the figure in the best format depending on the context**. As a result, scientists can now use a single well-developed function to report results in multiple formats, streamlining insight generation and reducing maintenance costs in the long run through shared templates.

#### Impact

**Plinth’s solution enables scientists to focus on the science of categorizing and interpreting treatment sequence data, while empowering them to communicate their insights through figures that are trustworthy, professional, and consistent.**
