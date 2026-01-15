import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const INFOGRAPHIC_TEMPLATES = [
  "sequence-zigzag-steps-underline-text",
  "sequence-horizontal-zigzag-underline-text",
  "sequence-horizontal-zigzag-simple-illus",
  "sequence-circular-simple",
  "sequence-filter-mesh-simple",
  "sequence-mountain-underline-text",
  "sequence-cylinders-3d-simple",
  "sequence-color-snake-steps-horizontal-icon-line",
  "sequence-pyramid-simple",
  "sequence-funnel-simple",
  "sequence-roadmap-vertical-simple",
  "sequence-roadmap-vertical-plain-text",
  "sequence-zigzag-pucks-3d-simple",
  "sequence-ascending-steps",
  "sequence-ascending-stairs-3d-underline-text",
  "sequence-snake-steps-compact-card",
  "sequence-snake-steps-underline-text",
  "sequence-snake-steps-simple",
  "sequence-stairs-front-compact-card",
  "sequence-stairs-front-pill-badge",
  "sequence-timeline-simple",
  "sequence-timeline-rounded-rect-node",
  "sequence-timeline-simple-illus",
  "compare-binary-horizontal-simple-fold",
  "compare-hierarchy-left-right-circle-node-pill-badge",
  "compare-swot",
  "quadrant-quarter-simple-card",
  "quadrant-quarter-circular",
  "quadrant-simple-illus",
  "relation-circle-icon-badge",
  "relation-circle-circular-progress",
  "compare-binary-horizontal-badge-card-arrow",
  "compare-binary-horizontal-underline-text-vs",
  "hierarchy-tree-tech-style-capsule-item",
  "hierarchy-tree-curved-line-rounded-rect-node",
  "hierarchy-tree-tech-style-badge-card",
  "hierarchy-structure",
  "chart-column-simple",
  "chart-bar-plain-text",
  "chart-line-plain-text",
  "chart-pie-plain-text",
  "chart-pie-compact-card",
  "chart-pie-donut-plain-text",
  "chart-pie-donut-pill-badge",
  "chart-wordcloud",
  "list-grid-badge-card",
  "list-grid-candy-card-lite",
  "list-grid-ribbon-card",
  "list-row-horizontal-icon-arrow",
  "list-row-simple-illus",
  "list-sector-plain-text",
  "list-column-done-list",
  "list-column-vertical-icon-arrow",
  "list-column-simple-vertical-arrow",
  "list-zigzag-down-compact-card",
  "list-zigzag-down-simple",
  "list-zigzag-up-compact-card",
  "list-zigzag-up-simple",
  "relation-dagre-flow-tb-simple-circle-node",
  "relation-dagre-flow-tb-animated-simple-circle-node",
  "relation-dagre-flow-tb-badge-card",
  "relation-dagre-flow-tb-animated-badge-card",
] as const;

const itemSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  value: z.number().optional(),
  desc: z.string().optional(),
  icon: z.string().optional(),
  illus: z.string().optional(),
  group: z.string().optional(),
  time: z.string().optional(),
  children: z.array(z.lazy(() => itemSchema)).optional(),
});

type ItemSchema = z.infer<typeof itemSchema>;

const relationSchema = z.object({
  id: z.string().optional(),
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  direction: z.enum(["forward", "both", "none"]).optional(),
  showArrow: z.boolean().optional(),
  arrowType: z.enum(["arrow", "triangle", "diamond"]).optional(),
});

const themeSchema = z.object({
  base: z.enum(["light", "dark"]).optional(),
  palette: z.array(z.string()).optional(),
  stylize: z.enum(["rough", "pattern", "linear-gradient", "radial-gradient"]).optional(),
  fontFamily: z.string().optional(),
});

function generateSyntax(
  template: string,
  data: {
    title?: string;
    desc?: string;
    items: ItemSchema[];
    relations?: z.infer<typeof relationSchema>[];
  },
  theme?: z.infer<typeof themeSchema>
): string {
  const lines: string[] = [`infographic ${template}`];

  if (theme) {
    lines.push("theme");
    if (theme.base) lines.push(`  ${theme.base}`);
    if (theme.stylize) lines.push(`  stylize ${theme.stylize}`);
    if (theme.palette && theme.palette.length > 0) {
      lines.push("  palette");
      for (const color of theme.palette) {
        lines.push(`    - ${color}`);
      }
    }
    if (theme.fontFamily) {
      lines.push("  base");
      lines.push("    text");
      lines.push(`      font-family ${theme.fontFamily}`);
    }
  }

  lines.push("data");
  if (data.title) lines.push(`  title ${data.title}`);
  if (data.desc) lines.push(`  desc ${data.desc}`);

  if (data.items && data.items.length > 0) {
    lines.push("  items");
    for (const item of data.items) {
      renderItem(item, lines, 4);
    }
  }

  if (data.relations && data.relations.length > 0) {
    lines.push("  relations");
    for (const rel of data.relations) {
      lines.push(`    - from ${rel.from}`);
      lines.push(`      to ${rel.to}`);
      if (rel.label) lines.push(`      label ${rel.label}`);
      if (rel.direction) lines.push(`      direction ${rel.direction}`);
      if (rel.showArrow !== undefined) lines.push(`      showArrow ${rel.showArrow}`);
      if (rel.arrowType) lines.push(`      arrowType ${rel.arrowType}`);
    }
  }

  return lines.join("\n");
}

function renderItem(item: ItemSchema, lines: string[], indent: number): void {
  const pad = " ".repeat(indent);
  lines.push(`${pad}- label ${item.label || ""}`);
  if (item.id) lines.push(`${pad}  id ${item.id}`);
  if (item.value !== undefined) lines.push(`${pad}  value ${item.value}`);
  if (item.desc) lines.push(`${pad}  desc ${item.desc}`);
  if (item.icon) lines.push(`${pad}  icon ${item.icon}`);
  if (item.illus) lines.push(`${pad}  illus ${item.illus}`);
  if (item.group) lines.push(`${pad}  group ${item.group}`);
  if (item.time) lines.push(`${pad}  time ${item.time}`);
  if (item.children && item.children.length > 0) {
    lines.push(`${pad}  children`);
    for (const child of item.children) {
      renderItem(child, lines, indent + 4);
    }
  }
}

export const infographicTool = createTool({
  id: "infographic-creator",
  description: `Create beautiful infographics for visualizing data, processes, comparisons, timelines, etc.

**When to use this tool:**
- User needs to visualize data, processes, comparisons, timelines, hierarchies, or relationships
- User asks for charts, diagrams, flowcharts, or infographics

**After calling this tool:**
You MUST output the returned syntax in a markdown code block with proper formatting:

1. Add a blank line before the code block
2. Use \`\`\`infographic (three backticks + infographic, no space)
3. Output the complete syntax returned by the tool
4. End with \`\`\`

Example output format:
(Your explanation text)

\`\`\`infographic
infographic sequence-roadmap-vertical-simple
data
  title Example Title
  items
    - label Step 1
\`\`\`

**Template Selection Guidelines:**
- Sequential processes/steps/timelines → sequence-* templates
- Listing viewpoints → list-row-* or list-column-* templates
- Comparative analysis (pros/cons) → compare-binary-* templates
- SWOT analysis → compare-swot
- Hierarchical structure (tree) → hierarchy-tree-*
- Data charts → chart-* templates
- Quadrant analysis → quadrant-* templates
- Grid lists → list-grid-* templates
- Relationship display → relation-circle-*
- Word cloud → chart-wordcloud

**Icon format:** <collection>/<icon-name>, e.g., mdi/rocket-launch, fa/star, bi/check-circle
**Illustration format:** filename without .svg, e.g., coding, team-work, analytics`,

  inputSchema: z.object({
    template: z.enum(INFOGRAPHIC_TEMPLATES).describe("The infographic template to use"),
    title: z.string().optional().describe("Main title of the infographic"),
    desc: z.string().optional().describe("Description/subtitle of the infographic"),
    items: z.array(itemSchema).describe("Data items to display in the infographic"),
    relations: z.array(relationSchema).optional().describe("Relations between items (for relation/flow templates)"),
    theme: themeSchema.optional().describe("Theme customization options"),
  }),

  outputSchema: z.object({
    syntax: z.string().describe("The generated AntV Infographic syntax"),
  }),

  execute: async ({ context }) => {
    const { template, title, desc, items, relations, theme } = context;

    const syntaxContent = generateSyntax(
      template,
      { title, desc, items, relations },
      theme
    );

    return { syntax: syntaxContent };
  },
});
