---
author: null
category: "Case Study"
blogImage:
  src: "../../assets/webflow/67e472384e8e134a6dae18cb_immortaltimebias.png"
  alt: null
  webflowFileId: "67e472384e8e134a6dae18cb"
shortDescription: null
mainStory: false
orderNumber: null
slug: "effects-of-immortal-time-bias-on-key-survival-outcomes-when-retrospectively-recruiting-patients-post-index-date"
title: "Understanding and Correcting Immortal Time Bias: A Critical Component of Survival Analysis"
status:
  isDraft: false
  isArchived: false
  published: true
webflowId: "67e4757e8c7b0a6638adc464"
createdOn: "2025-03-26T21:45:34.492Z"
lastUpdated: "2025-03-27T15:26:29.791Z"
lastPublished: "2025-05-27T11:59:28.711Z"
---

## Effects of immortal time bias on key survival outcomes when retrospectively recruiting patients post index date

Immortal time bias represents one of the most insidious methodological challenges in real-world evidence generation. At Plinth, we've repeatedly observed this issue across multiple patient-centric data vendors who require patients to first enroll in a study before their records can be requested and processed.

### Motivation

When patients must survive from diagnosis to enrollment to be included in a dataset, this creates an "immortal period" where, by definition, no deaths can occur. This systematically excludes patients who die before enrollment, artificially inflating survival estimates compared to clinical trials or datasets that don't require enrollment.

As illustrated in the timeline diagram above, patients who do not survive long after diagnosis  either cannot, or are less likely to, enroll in a study that performs retrospective data collection. This phenomenon creates a fundamental distortion: survival appears better than it truly is in the general patient population. Amongst the projects Plinth has worked on, we’ve identified this pattern across at least three different real-world data sources, solidifying it as a persistent challenge requiring methodological correction.

**Real-World Impact**

The consequences of ignoring immortal time bias can be severe. In our experience with EHR-based datasets, we've observed that cohorts requiring enrollment consistently show better survival outcomes than comparable clinical trial populations - not because of superior treatment, but due to this methodological artifact. This can lead to:

1.  Overestimation of treatment effectiveness
2.  Unrealistic expectations for real-world outcomes
3.  Misleading comparisons between treatment options
4.  Potentially harmful clinical decision-making based on biased data

### Solution

The key to addressing immortal time bias lies in properly defining when patients truly enter the risk set (often called cohort-entry). Rather than using the index date (like diagnosis) as the observation start, analysts must use the date when all patients’ inclusion criteria can be evaluated - typically the latest of:

-   Enrollment date
-   Diagnosis date
-   Any test or biomarker collection date
-   Any other event required to enter the dataset (such as listing healthcare providers or signing record collection authorization)

Statistically, this requires implementing left-truncated survival analysis techniques, such as using the counting process format in R through _Surv(time1, time2, status)_ where:

-   _`time1`_ represents time from index to cohort entry
-   _`time2`_ represents time from index to event/censoring
-   _`status`_ indicates whether an event occurred

This approach ensures patients contribute to risk calculations only once they're actually observable in the dataset, producing more accurate and generalizable survival estimates.

At Plinth, we've developed robust methodologies to address this issue:

1.  **Careful cohort entry definition**: We meticulously identify the exact date when patients become observable in the dataset, often requiring complex logic to determine when all enrollment criteria are met. This often requires understanding the full data generating process (enrollment, record collection, processing, etc).
2.  **Specialized analytical methods**: We implement statistical techniques specifically designed to address immortal time bias across various analytical platforms.
3.  **Comprehensive documentation**: We provide clear documentation of our methods, ensuring transparency and reproducibility.
4.  **Validation against reference datasets**: When possible, we validate our approaches by comparing results against datasets without immortal time issues.

Our experience has shown that when properly implemented, these corrections can significantly change outcome interpretations, sometimes revealing survival differences that were previously masked by methodological bias.

### Impact

By focusing on proper cohort entry time calculation, Plinth's analytical frameworks ensure that real-world evidence accurately reflects patient outcomes, providing more reliable insights for clinical and regulatory decision-making.

Time and time again, we find that correcting for immortal time creates estimates much closer to those published in clinical trial and pre-enrollment registries. While immortal time bias correction does correct for delayed at-risk entry, it does not solve other forms of sample bias, and sheds little light on early hazard estimates if an entire cohort suffers from immortal time, leading to large confidence intervals for early hazard estimates.

**Unadjusted for Immortal Time**

Index Date: Metastatic Diagnosis Date

Event Date: Death

Cohort Entry (Risk Start): Diagnosis Date

Cohort Exit (Risk Ends): coalesce(death date, last medical record/visit)

Median Survival: 115 Months

**Adjusted for Immortal Time**

Index Date: Metastatic Diagnosis Date

Event Date: Death

Cohort Entry (Risk Start): max(Diagnosis Date, Sequencing Date, Enrollment Date)

Cohort Exit (Risk Ends): coalesce(death date, last medical record/visit)

Median Survival: 27 Months
