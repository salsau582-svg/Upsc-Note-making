import { ImportanceMarkerId, ImportanceMarkerMeta, NoteBlock, TableData, CornellNote, StandaloneComparison } from '../types/note';

export const IMPORTANCE_MARKERS: ImportanceMarkerMeta[] = [
  {
    id: 'very-important',
    label: 'Very Important',
    shortLabel: 'VERY IMPORTANT',
    description: 'Extremely important facts, constitutional provisions, landmark judgments, and high-priority exam content.',
    bgHex: '#FEF2F2',
    borderHex: '#FECACA',
    textHex: '#991B1B',
    dotHex: '#DC2626',
    printBgHex: '#FCE8E8',
  },
  {
    id: 'important',
    label: 'Important',
    shortLabel: 'IMPORTANT',
    description: 'Frequently asked topics, significant facts, and core concepts.',
    bgHex: '#FFF7ED',
    borderHex: '#FED7AA',
    textHex: '#9A3412',
    dotHex: '#EA580C',
    printBgHex: '#FDF0E2',
  },
  {
    id: 'prelims-fact',
    label: 'Prelims Fact',
    shortLabel: 'PRELIMS FACT',
    description: 'Factual details, dates, articles, amendments, reports, indices, locations, and data.',
    bgHex: '#FEFCE8',
    borderHex: '#FDE047',
    textHex: '#854D0E',
    dotHex: '#CA8A04',
    printBgHex: '#FCF8D8',
  },
  {
    id: 'mains-value',
    label: 'Mains Value Addition',
    shortLabel: 'MAINS VALUE',
    description: 'Analytical arguments, case studies, committee recommendations, quotes, and contemporary relevance.',
    bgHex: '#EFF6FF',
    borderHex: '#BFDBFE',
    textHex: '#1E40AF',
    dotHex: '#2563EB',
    printBgHex: '#EAF2FC',
  },
  {
    id: 'conceptual',
    label: 'Conceptual Understanding',
    shortLabel: 'CONCEPTUAL',
    description: 'Background explanations that build conceptual clarity rather than direct rote facts.',
    bgHex: '#F0FDF4',
    borderHex: '#BBF7D0',
    textHex: '#166534',
    dotHex: '#16A34A',
    printBgHex: '#E8F8EE',
  },
  {
    id: 'revision-required',
    label: 'Revision Required',
    shortLabel: 'REVISE',
    description: 'Difficult, volatile, or frequently confused concepts needing repeated revision.',
    bgHex: '#FAF5FF',
    borderHex: '#E9D5FF',
    textHex: '#6B21A8',
    dotHex: '#9333EA',
    printBgHex: '#F4ECFC',
  },
];

export const MARKER_MAP: Record<ImportanceMarkerId, ImportanceMarkerMeta> = IMPORTANCE_MARKERS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<ImportanceMarkerId, ImportanceMarkerMeta>
);

export const DEFAULT_UPSC_SUBJECTS: string[] = [
  'Indian Polity',
  'Modern Indian History',
  'Ancient and Medieval History',
  'Geography',
  'Indian Economy',
  'Environment and Ecology',
  'Science and Technology',
  'International Relations',
  'Governance',
  'Social Justice',
  'Internal Security',
  'Ethics',
  'Art and Culture',
  'Current Affairs',
  'Essay',
  'Optional Subject',
];

export function createId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(partial: Partial<NoteBlock> & { type: NoteBlock['type'] }): NoteBlock {
  return {
    id: createId('blk'),
    content: '',
    indent: 0,
    checked: false,
    isOpen: true,
    marker: null,
    ...partial,
  };
}

export interface ComparisonTemplateDef {
  key: string;
  title: string;
  subject: string;
  relevance: 'Prelims' | 'Mains' | 'Both';
  table: TableData;
}

export const COMPARISON_TEMPLATES: ComparisonTemplateDef[] = [
  {
    key: 'fr-vs-dpsp',
    title: 'Fundamental Rights vs Directive Principles of State Policy (DPSP)',
    subject: 'Indian Polity',
    relevance: 'Both',
    table: {
      caption: 'Fundamental Rights (Part III) vs DPSP (Part IV)',
      hasHeader: true,
      isComparison: true,
      colWidths: [24, 38, 38],
      headers: ['Dimension', 'Fundamental Rights (Part III)', 'Directive Principles (Part IV)'],
      rows: [
        ['Constitutional Articles', 'Articles 12 to 35', 'Articles 36 to 51'],
        ['Source / Inspiration', 'Constitution of USA (Bill of Rights)', 'Irish Constitution (borrowed from Spain)'],
        ['Nature & Justiciability', 'Justiciable; enforceable by courts (Art. 32 & 226)', 'Non-justiciable; fundamental in governance (Art. 37)'],
        ['Aim / Objective', 'Establishes political democracy', 'Establishes social and economic democracy (Welfare State)'],
        ['Sanction', 'Legal sanction backed by courts', 'Moral and political sanction backed by public opinion'],
        ['Nature of Mandate', 'Mostly negative obligations restricting State action', 'Positive obligations directing the State to act'],
        ['Suspension', 'Can be suspended during National Emergency (except Art. 20 & 21)', 'No provision for suspension'],
      ],
    },
  },
  {
    key: 'ls-vs-rs',
    title: 'Lok Sabha vs Rajya Sabha',
    subject: 'Indian Polity',
    relevance: 'Both',
    table: {
      caption: 'Comparison between Lok Sabha and Rajya Sabha',
      hasHeader: true,
      isComparison: true,
      colWidths: [24, 38, 38],
      headers: ['Parameter', 'Lok Sabha (House of the People)', 'Rajya Sabha (Council of States)'],
      rows: [
        ['Constitutional Article', 'Article 81', 'Article 80'],
        ['Maximum Strength', '550 (530 States + 20 UTs)', '250 (238 States/UTs + 12 Nominated)'],
        ['Election Method', 'Direct election via Universal Adult Franchise (FPTP)', 'Indirect election by State MLAs (PR with STV)'],
        ['Tenure', '5 years (subject to earlier dissolution)', 'Permanent House; 1/3rd members retire every 2 years (6-yr term)'],
        ['Minimum Age', '25 years', '30 years'],
        ['Money Bill (Art. 110)', 'Can only be introduced here; Speaker certifies; final say', 'Cannot amend/reject; must return within 14 days'],
        ['Special Exclusive Powers', 'No-Confidence Motion (Art. 75); Joint Sitting presided by Speaker', 'Art. 249 (State List legislation), Art. 312 (All India Services)'],
      ],
    },
  },
  {
    key: 'president-vs-governor',
    title: 'President of India vs State Governor',
    subject: 'Indian Polity',
    relevance: 'Both',
    table: {
      caption: 'Constitutional Position & Powers: President vs Governor',
      hasHeader: true,
      isComparison: true,
      colWidths: [24, 38, 38],
      headers: ['Aspect', 'President of India', 'Governor of a State'],
      rows: [
        ['Appointment / Election', 'Indirectly elected by Electoral College (Art. 54–55)', 'Appointed by the President by warrant under hand and seal (Art. 155)'],
        ['Tenure & Removal', '5 years; removed only by Impeachment (Art. 61)', '5 years; holds office during pleasure of the President (Art. 156)'],
        ['Discretionary Powers', 'Only situational discretion (no explicit constitutional discretion)', 'Both constitutional (Art. 163, 200, 356) & situational discretion'],
        ['Ordinance Power', 'Article 123', 'Article 213 (requires President’s instruction in certain cases)'],
        ['Pardoning Power (Art. 72 vs 161)', 'Can pardon death sentence & Court Martial sentences', 'Cannot pardon death sentence (can suspend/remit/commute) or Court Martial'],
        ['Bill Reservation', 'Cannot reserve bills for another authority', 'Can reserve State Bills for President’s consideration (Art. 200 & 201)'],
      ],
    },
  },
  {
    key: 'parliamentary-vs-presidential',
    title: 'Parliamentary vs Presidential System of Government',
    subject: 'Indian Polity',
    relevance: 'Both',
    table: {
      caption: 'Parliamentary System vs Presidential System',
      hasHeader: true,
      isComparison: true,
      colWidths: [24, 38, 38],
      headers: ['Feature', 'Parliamentary System (India, UK)', 'Presidential System (USA)'],
      rows: [
        ['Executive Structure', 'Dual executive (Nominal Head + Real Head)', 'Single executive (President is both Head of State & Govt)'],
        ['Separation of Powers', 'Fusion of Executive and Legislature', 'Strict separation of powers with checks & balances'],
        ['Accountability', 'Executive collectively responsible to Lower House (Art. 75(3))', 'Executive is not responsible to Legislature for policies'],
        ['Tenure Stability', 'Uncertain tenure (depends on legislative majority)', 'Fixed tenure (4 years in US; removal only via impeachment)'],
        ['Cabinet Membership', 'Ministers must be members of Parliament (within 6 months)', 'Cabinet secretaries chosen from outside Congress'],
        ['Key Merit / Demerit', 'Prevents despotism & ensures harmony; risks instability', 'Stable govt & policy continuity; risk of legislative deadlock'],
      ],
    },
  },
  {
    key: 'np-vs-wls',
    title: 'National Park vs Wildlife Sanctuary',
    subject: 'Environment and Ecology',
    relevance: 'Prelims',
    table: {
      caption: 'Protected Area Comparison under Wildlife Protection Act, 1972',
      hasHeader: true,
      isComparison: true,
      colWidths: [24, 38, 38],
      headers: ['Criteria', 'National Park', 'Wildlife Sanctuary'],
      rows: [
        ['Statutory Basis', 'Section 35 of Wildlife Protection Act, 1972', 'Section 18 / 26A of Wildlife Protection Act, 1972'],
        ['Degree of Protection', 'Higher degree of protection', 'Relatively lower degree of protection'],
        ['Human Activities & Grazing', 'Strictly prohibited (no grazing or private rights)', 'Certain regulated rights/grazing may be permitted by Collector'],
        ['Boundary Alteration', 'Cannot be altered except by a resolution of State Legislature', 'Altered by State Legislature resolution (similar safeguard under WPA)'],
        ['Focus', 'Not centred around a single species; ecosystem protection', 'Can be created for a particular species (e.g., Grizzled Squirrel WLS)'],
        ['Upgradation', 'Cannot be downgraded to a Wildlife Sanctuary', 'Can be upgraded to a National Park'],
      ],
    },
  },
  {
    key: 'two-schemes',
    title: 'Comparison of Any Two Government Schemes',
    subject: 'Governance',
    relevance: 'Both',
    table: {
      caption: 'Structured Comparison of Two Government Schemes',
      hasHeader: true,
      isComparison: true,
      colWidths: [24, 38, 38],
      headers: ['Parameter', 'Scheme A (Edit Name)', 'Scheme B (Edit Name)'],
      rows: [
        ['Nodal Ministry', '', ''],
        ['Launch Year & Type', 'Central Sector / Centrally Sponsored', 'Central Sector / Centrally Sponsored'],
        ['Core Objective', '', ''],
        ['Target Beneficiaries', '', ''],
        ['Funding Pattern', '', ''],
        ['Key Implementation Mechanism', '', ''],
        ['Major Achievements / Gaps', '', ''],
      ],
    },
  },
  {
    key: 'two-provisions',
    title: 'Comparison of Any Two Constitutional Provisions',
    subject: 'Indian Polity',
    relevance: 'Both',
    table: {
      caption: 'Side-by-Side Constitutional Provision Comparison',
      hasHeader: true,
      isComparison: true,
      colWidths: [24, 38, 38],
      headers: ['Dimension', 'Provision A (Article / Part)', 'Provision B (Article / Part)'],
      rows: [
        ['Article & Part', '', ''],
        ['Origin / Amendment History', '', ''],
        ['Scope & Applicability', '', ''],
        ['Exceptions / Limitations', '', ''],
        ['Landmark SC Judgment', '', ''],
        ['UPSC Prelims / Mains Trap', '', ''],
      ],
    },
  },
  {
    key: 'two-historical-events',
    title: 'Comparison of Any Two Historical Events / Movements',
    subject: 'Modern Indian History',
    relevance: 'Both',
    table: {
      caption: 'Comparative Historical Analysis',
      hasHeader: true,
      isComparison: true,
      colWidths: [24, 38, 38],
      headers: ['Analytical Axis', 'Event / Movement A', 'Event / Movement B'],
      rows: [
        ['Year & Immediate Trigger', '', ''],
        ['Key Leaders & Organisations', '', ''],
        ['Social Base / Participation', '', ''],
        ['Methods & Ideology', '', ''],
        ['British / State Response', '', ''],
        ['Outcome & Historical Significance', '', ''],
      ],
    },
  },
];

export interface NoteTemplateDef {
  id: string;
  label: string;
  category: 'General' | 'Prelims' | 'Mains';
  relevance: 'Prelims' | 'Mains' | 'Both';
  defaultSubject?: string;
  description: string;
  cuesBlocks: () => NoteBlock[];
  notesBlocks: () => NoteBlock[];
  summaryBlocks: () => NoteBlock[];
}

export const NOTE_TEMPLATES: NoteTemplateDef[] = [
  {
    id: 'blank',
    label: 'Blank Cornell Note',
    category: 'General',
    relevance: 'Both',
    description: 'Clean three-part Cornell sheet with Cues, Main Notes, and Summary.',
    cuesBlocks: () => [
      createBlock({ type: 'heading3', content: 'Key Questions & Triggers' }),
      createBlock({ type: 'bullet', content: '' }),
    ],
    notesBlocks: () => [
      createBlock({ type: 'heading2', content: 'Overview' }),
      createBlock({ type: 'paragraph', content: '' }),
    ],
    summaryBlocks: () => [
      createBlock({ type: 'paragraph', content: '' }),
    ],
  },
  {
    id: 'prelims-mode',
    label: 'Prelims Mode Sheet',
    category: 'Prelims',
    relevance: 'Prelims',
    description: 'Structured factual sheet for Articles, Amendments, Chronology, Schemes, Reports, and PYQ traps.',
    cuesBlocks: () => [
      createBlock({ type: 'heading3', content: 'Recall Triggers & Traps' }),
      createBlock({ type: 'bullet', content: 'Frequently confused distinction?' }),
      createBlock({ type: 'bullet', content: 'Exact year / constitutional article?' }),
      createBlock({ type: 'bullet', content: 'Nodal ministry / organisation?' }),
      createBlock({ type: 'bullet', content: 'PYQ elimination cue' }),
    ],
    notesBlocks: () => [
      createBlock({ type: 'heading2', content: '1. Core Factual Points', marker: 'prelims-fact' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: '2. Constitutional Articles & Amendments' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: '3. Dates, Chronology & Personalities' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: '4. Reports, Indices, Organisations & HQ' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: '5. Government Schemes / Places / Protected Areas & Species' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'fact', secondaryContent: 'Frequently Confused Concepts', content: '', marker: 'revision-required' }),
      createBlock({ type: 'heading2', content: '6. Previous Year Question (PYQ) References' }),
      createBlock({ type: 'bullet', content: '' }),
    ],
    summaryBlocks: () => [
      createBlock({ type: 'bullet', content: '30-second Prelims revision takeaway: ' }),
    ],
  },
  {
    id: 'mains-mode',
    label: 'Mains Issue Framework',
    category: 'Mains',
    relevance: 'Mains',
    description: 'Issue-based Mains answer architecture: Intro, Multi-dimensional Body, Committees, SC Judgments, Way Forward.',
    cuesBlocks: () => [
      createBlock({ type: 'heading3', content: 'Mains Demand & Keywords' }),
      createBlock({ type: 'bullet', content: 'Potential 10 / 15-marker question' }),
      createBlock({ type: 'bullet', content: 'Key constitutional articles' }),
      createBlock({ type: 'bullet', content: 'Committee / SC case to cite' }),
      createBlock({ type: 'bullet', content: 'Way forward keywords' }),
    ],
    notesBlocks: () => [
      createBlock({ type: 'heading2', content: 'Introduction & Contemporary Context' }),
      createBlock({ type: 'paragraph', content: '' }),
      createBlock({ type: 'heading2', content: 'Constitutional & Legal Dimensions', marker: 'very-important' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Social, Economic, Political & Ethical Dimensions' }),
      createBlock({ type: 'bullet', content: 'Social: ' }),
      createBlock({ type: 'bullet', content: 'Economic: ' }),
      createBlock({ type: 'bullet', content: 'Political / Governance: ' }),
      createBlock({ type: 'heading2', content: 'Key Challenges & Structural Causes' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Government Initiatives & Policy Measures' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Committees, SC Judgments & Case Studies', marker: 'mains-value' }),
      createBlock({ type: 'bullet', content: 'Committee Recommendation: ' }),
      createBlock({ type: 'bullet', content: 'Supreme Court Judgment: ' }),
      createBlock({ type: 'bullet', content: 'Example / Case Study: ' }),
      createBlock({ type: 'quote', secondaryContent: 'Relevant Quote / Statistic', content: '', marker: 'mains-value' }),
      createBlock({ type: 'heading2', content: 'Way Forward & Conclusion' }),
      createBlock({ type: 'bullet', content: '' }),
    ],
    summaryBlocks: () => [
      createBlock({ type: 'paragraph', content: 'Balanced conclusion line for Mains answers: ' }),
    ],
  },
  {
    id: 'gs1',
    label: 'GS Paper 1',
    category: 'Mains',
    relevance: 'Mains',
    defaultSubject: 'Modern Indian History',
    description: 'History, Art & Culture, Indian Society, and Geography structured template.',
    cuesBlocks: () => [
      createBlock({ type: 'heading3', content: 'GS-1 Recall Prompts' }),
      createBlock({ type: 'bullet', content: 'Timeline / Spatial location?' }),
      createBlock({ type: 'bullet', content: 'Continuity vs Change?' }),
      createBlock({ type: 'bullet', content: 'Regional examples / maps?' }),
    ],
    notesBlocks: () => [
      createBlock({ type: 'heading2', content: 'Historical / Geographical / Social Context' }),
      createBlock({ type: 'paragraph', content: '' }),
      createBlock({ type: 'heading2', content: 'Salient Features & Factors' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Regional Variations & Examples', marker: 'mains-value' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Significance & Contemporary Relevance' }),
      createBlock({ type: 'paragraph', content: '' }),
    ],
    summaryBlocks: () => [
      createBlock({ type: 'paragraph', content: '' }),
    ],
  },
  {
    id: 'gs2',
    label: 'GS Paper 2',
    category: 'Mains',
    relevance: 'Mains',
    defaultSubject: 'Indian Polity',
    description: 'Polity, Constitution, Governance, Social Justice & International Relations.',
    cuesBlocks: () => [
      createBlock({ type: 'heading3', content: 'GS-2 Triggers' }),
      createBlock({ type: 'bullet', content: 'Relevant Articles / Schedules?' }),
      createBlock({ type: 'bullet', content: '2nd ARC / Law Commission?' }),
      createBlock({ type: 'bullet', content: 'SC Landmark Ruling?' }),
    ],
    notesBlocks: () => [
      createBlock({ type: 'heading2', content: 'Constitutional Mandate & Statutory Framework', marker: 'very-important' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Institutional Issues & Federal / Governance Friction' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Committee Recommendations & Judicial Pronouncements', marker: 'mains-value' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Reforms & Way Forward' }),
      createBlock({ type: 'bullet', content: '' }),
    ],
    summaryBlocks: () => [
      createBlock({ type: 'paragraph', content: '' }),
    ],
  },
  {
    id: 'gs3',
    label: 'GS Paper 3',
    category: 'Mains',
    relevance: 'Mains',
    defaultSubject: 'Indian Economy',
    description: 'Economy, Agriculture, S&T, Environment, Disaster Management & Internal Security.',
    cuesBlocks: () => [
      createBlock({ type: 'heading3', content: 'GS-3 Data & Policy' }),
      createBlock({ type: 'bullet', content: 'Economic Survey / Budget data?' }),
      createBlock({ type: 'bullet', content: 'NITI Aayog / RBI metric?' }),
      createBlock({ type: 'bullet', content: 'Tech / Security dimension?' }),
    ],
    notesBlocks: () => [
      createBlock({ type: 'heading2', content: 'Status & Key Macro Data', marker: 'prelims-fact' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Structural Bottlenecks & Challenges' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Government Schemes & Regulatory Steps' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Sustainable & Tech-Driven Way Forward', marker: 'mains-value' }),
      createBlock({ type: 'bullet', content: '' }),
    ],
    summaryBlocks: () => [
      createBlock({ type: 'paragraph', content: '' }),
    ],
  },
  {
    id: 'gs4',
    label: 'GS Paper 4 (Ethics)',
    category: 'Mains',
    relevance: 'Mains',
    defaultSubject: 'Ethics',
    description: 'Ethical concepts, thinkers, administrative dilemmas, and real-life civil service examples.',
    cuesBlocks: () => [
      createBlock({ type: 'heading3', content: 'Ethics Anchors' }),
      createBlock({ type: 'bullet', content: 'Core Value / Definition?' }),
      createBlock({ type: 'bullet', content: 'Thinker / Quote?' }),
      createBlock({ type: 'bullet', content: 'Administrative Example?' }),
    ],
    notesBlocks: () => [
      createBlock({ type: 'definition', secondaryContent: 'Core Ethical Concept', content: '', marker: 'very-important' }),
      createBlock({ type: 'heading2', content: 'Philosophical Basis & Thinkers' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Application in Public Administration & Governance' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Real-Life Examples & Case Studies', marker: 'mains-value' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'quote', secondaryContent: 'Thinker / Statesman', content: '', marker: 'mains-value' }),
    ],
    summaryBlocks: () => [
      createBlock({ type: 'paragraph', content: '' }),
    ],
  },
  {
    id: 'essay',
    label: 'Essay',
    category: 'Mains',
    relevance: 'Mains',
    defaultSubject: 'Essay',
    description: 'Philosophical & thematic essay planner: Anecdote, PESTEL dimensions, Counter-arguments, Synthesis.',
    cuesBlocks: () => [
      createBlock({ type: 'heading3', content: 'Essay Flow' }),
      createBlock({ type: 'bullet', content: 'Opening hook / anecdote' }),
      createBlock({ type: 'bullet', content: 'Thesis statement' }),
      createBlock({ type: 'bullet', content: 'Antithesis / Nuance' }),
      createBlock({ type: 'bullet', content: 'Closing vision' }),
    ],
    notesBlocks: () => [
      createBlock({ type: 'heading2', content: '1. Opening Anecdote & Deconstruction of Topic' }),
      createBlock({ type: 'paragraph', content: '' }),
      createBlock({ type: 'heading2', content: '2. Multi-Dimensional Exploration (Individual -> Society -> Nation -> World)' }),
      createBlock({ type: 'bullet', content: 'Historical / Cultural: ' }),
      createBlock({ type: 'bullet', content: 'Socio-Economic: ' }),
      createBlock({ type: 'bullet', content: 'Political / Ethical: ' }),
      createBlock({ type: 'heading2', content: '3. Counter-Perspective & Synthesis' }),
      createBlock({ type: 'paragraph', content: '' }),
      createBlock({ type: 'quote', secondaryContent: 'Anchor Quote', content: '', marker: 'mains-value' }),
    ],
    summaryBlocks: () => [
      createBlock({ type: 'paragraph', content: 'Circular conclusion linking back to opening anecdote: ' }),
    ],
  },
  {
    id: 'optional',
    label: 'Optional Subject',
    category: 'Mains',
    relevance: 'Mains',
    defaultSubject: 'Optional Subject',
    description: 'Academic depth template with scholars, theories, criticism, and contemporary Indian linkage.',
    cuesBlocks: () => [
      createBlock({ type: 'heading3', content: 'Scholar & Paper Linkage' }),
      createBlock({ type: 'bullet', content: 'Key thinkers / schools?' }),
      createBlock({ type: 'bullet', content: 'Critiques?' }),
      createBlock({ type: 'bullet', content: 'Paper 1 <-> Paper 2 link?' }),
    ],
    notesBlocks: () => [
      createBlock({ type: 'heading2', content: 'Theoretical Core & Conceptual Framework', marker: 'conceptual' }),
      createBlock({ type: 'paragraph', content: '' }),
      createBlock({ type: 'heading2', content: 'Key Thinkers, Works & Arguments', marker: 'mains-value' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Critical Evaluation & Counter-Schools' }),
      createBlock({ type: 'bullet', content: '' }),
      createBlock({ type: 'heading2', content: 'Indian Context & Contemporary Application' }),
      createBlock({ type: 'paragraph', content: '' }),
    ],
    summaryBlocks: () => [
      createBlock({ type: 'paragraph', content: '' }),
    ],
  },
];

export function buildSampleReferenceNotes(): { notes: CornellNote[]; comparisons: StandaloneComparison[] } {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();
  const tomorrow = new Date(now.getTime() + 86400000).toISOString();

  const note1: CornellNote = {
    id: createId('note'),
    title: 'Basic Structure Doctrine & Judicial Review',
    subject: 'Indian Polity',
    topic: 'Constitutional Framework',
    subtopic: 'Amending Power under Article 368',
    source: 'M. Laxmikanth (Ch. 11) + Kesavananda Bharati Judgment Summary',
    tags: ['Article 368', 'Basic Structure', 'SC Judgments', 'GS-2'],
    relevance: 'Both',
    templateUsed: 'gs2',
    createdAt: threeDaysAgo,
    updatedAt: yesterday,
    cuesRatio: 30,
    isBookmarked: true,
    isArchived: false,
    isDifficult: false,
    revision: {
      lastRevisedAt: threeDaysAgo,
      nextRevisionAt: now.toISOString(), // due today so user can test revision immediately
      intervalDays: 3,
      count: 1,
      history: [
        { id: createId('rev'), date: threeDaysAgo, intervalDays: 3, note: 'Initial reading & case chronology' },
      ],
    },
    cuesBlocks: [
      createBlock({ type: 'heading3', content: 'Recall Questions' }),
      createBlock({ type: 'bullet', content: 'Does Art. 368 allow Parliament to alter the identity of the Constitution?' }),
      createBlock({ type: 'bullet', content: 'What was the 13-judge bench verdict ratio in Kesavananda Bharati (1973)?' }),
      createBlock({ type: 'bullet', content: 'Difference between <b>24th</b> and <b>42nd</b> Amendment Acts regarding Art. 368?' }),
      createBlock({ type: 'bullet', content: 'Where does the Constitution define "Basic Structure"?' }),
    ],
    notesBlocks: [
      createBlock({
        type: 'fact',
        secondaryContent: 'Constitutional Position (Prelims Trap)',
        content: 'The term <b>"Basic Structure"</b> is <mark data-marker="prelims-fact">NOT defined anywhere in the Constitution of India</mark>. It is a judicial innovation evolved by the Supreme Court from 1973 onwards.',
        marker: 'prelims-fact',
      }),
      createBlock({ type: 'heading2', content: '1. Evolution Through Landmark Judgments', marker: 'very-important' }),
      createBlock({ type: 'numbered', content: '<b>Shankari Prasad (1951):</b> Parliament can amend Fundamental Rights under Art. 368; "law" in Art. 13(2) includes only ordinary laws, not Constitutional Amendment Acts.' }),
      createBlock({ type: 'numbered', content: '<b>Golaknath Case (1967):</b> Reversed earlier stand; Fundamental Rights have a "transcendental and immutable" position; Parliament cannot abridge FRs.' }),
      createBlock({ type: 'numbered', content: '<b>Kesavananda Bharati (1973):</b> Overruled Golaknath; upheld 24th Amendment; ruled Parliament can amend any part including FRs, <mark data-marker="very-important">provided it does not alter the Basic Structure</mark> (7:6 majority, 24 April 1973).' }),
      createBlock({ type: 'numbered', content: '<b>Minerva Mills (1980):</b> Invalidated Clauses (4) & (5) of Art. 368 added by 42nd Amendment; <mark data-marker="mains-value">Judicial Review and harmony between FRs & DPSP</mark> are part of Basic Structure.' }),
      createBlock({ type: 'numbered', content: '<b>I.R. Coelho (2007):</b> Laws placed in the <b>9th Schedule</b> after <mark data-marker="prelims-fact">24 April 1973</mark> are open to judicial review if they violate Basic Structure.' }),
      createBlock({
        type: 'table',
        table: {
          caption: 'Key Amendments Related to Article 368',
          hasHeader: true,
          isComparison: true,
          colWidths: [22, 39, 39],
          headers: ['Amendment', 'Key Provision', 'Judicial Status'],
          rows: [
            ['24th Amendment (1971)', 'Made President’s assent to Constitutional Amendment Bills obligatory; added Art. 13(4)', 'Upheld in Kesavananda Bharati (1973)'],
            ['42nd Amendment (1976)', 'Added clauses (4) & (5) to Art. 368 removing judicial review over amendments', 'Struck down in Minerva Mills (1980)'],
          ],
        },
      }),
      createBlock({
        type: 'quote',
        secondaryContent: 'Justice H.R. Khanna (Kesavananda Bharati, 1973)',
        content: '"The power to amend does not include the power to destroy or abrogate the basic framework of the Constitution."',
        marker: 'mains-value',
      }),
    ],
    summaryBlocks: [
      createBlock({
        type: 'bullet',
        content: 'Parliament’s constituent power under Art. 368 is wide but not unlimited; Basic Structure acts as an implied limitation safeguarding constitutionalism, federalism, secularism, and judicial review.',
      }),
    ],
    wordCount: 245,
  };

  const note2: CornellNote = {
    id: createId('note'),
    title: 'Monetary Policy Committee (MPC) & Inflation Targeting',
    subject: 'Indian Economy',
    topic: 'Monetary Policy & Banking',
    subtopic: 'Flexible Inflation Targeting (FIT)',
    source: 'RBI Act 1934 (Sec 45ZB) + Economic Survey',
    tags: ['RBI', 'MPC', 'Inflation', 'Prelims', 'GS-3'],
    relevance: 'Both',
    templateUsed: 'prelims-mode',
    createdAt: yesterday,
    updatedAt: yesterday,
    cuesRatio: 30,
    isBookmarked: false,
    isArchived: false,
    isDifficult: true,
    revision: {
      lastRevisedAt: yesterday,
      nextRevisionAt: tomorrow,
      intervalDays: 7,
      count: 1,
      history: [{ id: createId('rev'), date: yesterday, intervalDays: 7, note: 'Reviewed quorum & voting rules' }],
    },
    cuesBlocks: [
      createBlock({ type: 'heading3', content: 'Key Prelims Prompts' }),
      createBlock({ type: 'bullet', content: 'Statutory basis of MPC?' }),
      createBlock({ type: 'bullet', content: 'Composition & casting vote?' }),
      createBlock({ type: 'bullet', content: 'CPI vs WPI target?' }),
      createBlock({ type: 'bullet', content: 'What triggers failure to meet target?' }),
    ],
    notesBlocks: [
      createBlock({
        type: 'definition',
        secondaryContent: 'Flexible Inflation Targeting (FIT)',
        content: 'Monetary policy framework adopted in India (2016) where RBI targets <mark data-marker="prelims-fact">CPI (Combined) inflation at 4% with a tolerance band of +/- 2%</mark> (i.e., 2% to 6%), while keeping growth in mind.',
        marker: 'conceptual',
      }),
      createBlock({ type: 'heading2', content: 'Composition & Functioning of MPC', marker: 'prelims-fact' }),
      createBlock({ type: 'bullet', content: '<b>Statutory Body:</b> Constituted under <mark data-marker="prelims-fact">Section 45ZB of the RBI Act, 1934</mark> (amended via Finance Act 2016; based on Urjit Patel Committee).' }),
      createBlock({ type: 'bullet', content: '<b>6 Members:</b> 3 from RBI (Governor as ex-officio Chairperson, Deputy Governor in charge of Monetary Policy, 1 RBI Officer) + 3 Central Govt nominees (4-year term, not eligible for reappointment).' }),
      createBlock({ type: 'bullet', content: '<b>Voting & Quorum:</b> Quorum is 4 members. Decisions by majority vote; <mark data-marker="very-important">RBI Governor has a second/casting vote in case of tie</mark> (NO veto power).' }),
      createBlock({
        type: 'expandable',
        secondaryContent: 'Failure Criterion (Section 45ZN)',
        content: 'If average CPI inflation remains above 6% or below 2% for <b>three consecutive quarters</b>, RBI must submit a report to the Central Government explaining reasons, remedial actions, and estimated timeframe to return within band.',
        isOpen: true,
        marker: 'revision-required',
      }),
    ],
    summaryBlocks: [
      createBlock({
        type: 'bullet',
        content: 'MPC institutionalised rate-setting (6 members, majority + Governor casting vote) targeting CPI-C at 4% +/- 2% under amended RBI Act, 1934.',
      }),
    ],
    wordCount: 195,
  };

  const sampleComparison: StandaloneComparison = {
    id: createId('cmp'),
    title: COMPARISON_TEMPLATES[0].title,
    subject: COMPARISON_TEMPLATES[0].subject,
    relevance: COMPARISON_TEMPLATES[0].relevance,
    templateKey: COMPARISON_TEMPLATES[0].key,
    createdAt: yesterday,
    updatedAt: yesterday,
    table: JSON.parse(JSON.stringify(COMPARISON_TEMPLATES[0].table)),
    notes: 'Core Indian Polity comparison for Prelims statement elimination and GS-2 answers.',
  };

  return { notes: [note1, note2], comparisons: [sampleComparison] };
}
