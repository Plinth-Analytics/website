// Copy from the "Custom Solutions that Fit You Best" section of the Webflow homepage.
export interface Solution {
  id: string;
  name: string;
  icon: string; // exported icon id, see components/Icon.astro
  summary: string;
  listLabel: 'Examples' | 'Features';
  items: string[];
}

export const solutions: Solution[] = [
  {
    id: 'forge',
    name: 'Forge',
    icon: '6ace4896fe79762dabd31771',
    summary: 'Software engineering services, designed to bring you the custom tools you’ve been aching for.',
    listLabel: 'Examples',
    items: [
      'Cohort Builders',
      'Data Dashboards',
      'ETL Pipelines',
      'Data Science Tooling',
      'Data Harmonization',
      'Data Quality Monitoring',
      'OMOP Data Tooling',
      'HEOR Outcomes Tooling',
      'Synthetic Control Tooling',
      'Federated Client Data Portals',
    ],
  },
  {
    id: 'fulcrum',
    name: 'Fulcrum',
    icon: '6ace48c1a851c5ab4885a45f',
    summary:
      'A revolutionary cohort builder, designed to bridge the gap between data-rich environments and those eager to harness their potential, regardless of technical proficiency.',
    listLabel: 'Features',
    items: [
      'Attrition Table',
      'Code Generation',
      'Table1',
      'Treatment Pattern Explorer (ex. Sankey)',
      'Patient Geography (ex. region, state, zip)',
      'Dynamic time to event (ex. Kaplan-Meier)',
      'Patient Timeline',
      'Data Exploration',
    ],
  },
  {
    id: 'arc',
    name: 'ARC',
    icon: '6ace489848d97480933adda8',
    summary:
      'An analytics platform that lets teams pre‑specify statistical analysis plans, simulate data, and automatically render reproducible reports as data sources update.',
    listLabel: 'Features',
    items: [
      'LLM Annotations',
      'TLF builder',
      'Spec Validation',
      'Data Simulation',
      'Stratification Options',
      'Report Publishing',
      'Attrition Tables',
      'Treatment Patterns',
      'Patient Timeline',
      'Versioned Outputs',
    ],
  },
  {
    id: 'feature-studio',
    name: 'Feature Studio',
    icon: '6acc9d025ed8eae53b7eeb3b',
    summary:
      'From raw real-world data to analysis-ready datasets: built collaboratively, defined once, reusable everywhere.',
    listLabel: 'Features',
    items: [
      'Visual Component Builder',
      'Reusable Component Library',
      'Grain-Aware Validation',
      'Versioned Registry',
      'Temporal Transformers',
      'Multi-Backend Execution',
    ],
  },
  {
    id: 'pocket-analyst',
    name: 'Pocket Analyst',
    icon: '6acc9d02ff2549290ea01b89',
    summary:
      'Ask your data anything in plain English: no code required, deployed in your environment, shaped to your stack.',
    listLabel: 'Features',
    items: [
      'Bring Your Own Data',
      'Read-Only by Design',
      'Automatic Schema Detection',
      'One-Click Visualization',
      'Self-Hosted Deployment',
      'Fully Auditable SQL',
    ],
  },
];
