// ============================================================
// Resume renderer — single source of truth, two output formats
// ============================================================
// Both renderMarkdown() and renderDocx() consume the same structured
// resume shape (produced by gemini.buildTailoredResume). Adding new
// templates or sections only requires touching the renderers, not
// the prompt.
//
// Shape:
//   {
//     name, contact: { email, phone, location, url },
//     summary,
//     skills: string[]  OR { category: string, items: string[] }[],
//     experience: [{ title, company, location, startDate, endDate, bullets[] }],
//     education: [{ degree, institution, location, year }],
//     certifications: [string]?,
//     template: 'chronological' | 'hybrid' | 'skills_first'
//   }
// ============================================================

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Tab, TabStopType, TabStopPosition
} = require('docx');

// ------------------------------------------------------------
// Section order per template — the key difference between styles
// ------------------------------------------------------------
const SECTION_ORDER = {
  chronological: ['summary', 'experience', 'skills', 'education', 'certifications'],
  hybrid:        ['summary', 'skills', 'experience', 'education', 'certifications'],
  skills_first:  ['summary', 'skills', 'certifications', 'education', 'experience']
};

function sectionOrder(template) {
  return SECTION_ORDER[template] || SECTION_ORDER.chronological;
}

// ------------------------------------------------------------
// Markdown renderer
// ------------------------------------------------------------
function renderMarkdown(r) {
  const order = sectionOrder(r.template);
  const lines = [];

  // Header — name + contact line
  if (r.name) lines.push(`# ${r.name}`);
  const contactBits = [
    r.contact?.email,
    r.contact?.phone,
    r.contact?.location,
    r.contact?.url
  ].filter(Boolean);
  if (contactBits.length) lines.push(contactBits.join(' · '));
  lines.push('');

  for (const section of order) {
    switch (section) {
      case 'summary':
        if (r.summary) {
          lines.push('## Summary');
          lines.push(r.summary);
          lines.push('');
        }
        break;

      case 'skills':
        if (r.skills && (Array.isArray(r.skills) ? r.skills.length : Object.keys(r.skills).length)) {
          lines.push('## Skills');
          if (Array.isArray(r.skills)) {
            // Could be flat strings OR categorized objects
            const isCategorized = r.skills.length > 0 && typeof r.skills[0] === 'object';
            if (isCategorized) {
              for (const cat of r.skills) {
                lines.push(`- **${cat.category}**: ${(cat.items || []).join(', ')}`);
              }
            } else {
              lines.push(r.skills.join(' · '));
            }
          }
          lines.push('');
        }
        break;

      case 'experience':
        if (Array.isArray(r.experience) && r.experience.length) {
          lines.push('## Experience');
          for (const exp of r.experience) {
            const titleLine = `**${exp.title || ''}** — ${exp.company || ''}`;
            const meta = [exp.location, dateRange(exp.startDate, exp.endDate)].filter(Boolean).join(' · ');
            lines.push(`### ${titleLine}`);
            if (meta) lines.push(`*${meta}*`);
            if (Array.isArray(exp.bullets)) {
              for (const b of exp.bullets) lines.push(`- ${b}`);
            }
            lines.push('');
          }
        }
        break;

      case 'education':
        if (Array.isArray(r.education) && r.education.length) {
          lines.push('## Education');
          for (const ed of r.education) {
            const left = `**${ed.degree || ''}**, ${ed.institution || ''}`;
            const right = [ed.location, ed.year].filter(Boolean).join(' · ');
            lines.push(right ? `${left} — *${right}*` : left);
          }
          lines.push('');
        }
        break;

      case 'certifications':
        if (Array.isArray(r.certifications) && r.certifications.length) {
          lines.push('## Certifications');
          for (const c of r.certifications) lines.push(`- ${c}`);
          lines.push('');
        }
        break;
    }
  }

  return lines.join('\n').trim() + '\n';
}

function dateRange(start, end) {
  if (!start && !end) return '';
  return `${start || ''} – ${end || 'Present'}`;
}

// ------------------------------------------------------------
// Plain text — strip markdown for ATS-friendly copy/paste
// ------------------------------------------------------------
function renderPlainText(r) {
  return renderMarkdown(r)
    .replace(/^### (.*)$/gm, '$1')
    .replace(/^## (.*)$/gm, (_, s) => `\n${s.toUpperCase()}\n${'-'.repeat(s.length)}`)
    .replace(/^# (.*)$/gm, (_, s) => `${s}\n${'='.repeat(s.length)}`)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^- /gm, '• ');
}

// ------------------------------------------------------------
// .docx renderer — produces a Buffer the route can ship as a download
// ------------------------------------------------------------
async function renderDocx(r) {
  const order = sectionOrder(r.template);
  const children = [];

  // Name (large, centered)
  if (r.name) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: r.name, bold: true, size: 36 })]
    }));
  }

  // Contact line (centered, smaller)
  const contactBits = [
    r.contact?.email,
    r.contact?.phone,
    r.contact?.location,
    r.contact?.url
  ].filter(Boolean);
  if (contactBits.length) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: contactBits.join('  •  '), size: 20 })]
    }));
  }

  children.push(blankLine());

  for (const section of order) {
    switch (section) {
      case 'summary':
        if (r.summary) {
          children.push(sectionHeading('Summary'));
          children.push(new Paragraph({ children: [new TextRun({ text: r.summary, size: 22 })] }));
          children.push(blankLine());
        }
        break;

      case 'skills':
        if (r.skills && (Array.isArray(r.skills) ? r.skills.length : Object.keys(r.skills).length)) {
          children.push(sectionHeading('Skills'));
          if (Array.isArray(r.skills)) {
            const isCategorized = r.skills.length > 0 && typeof r.skills[0] === 'object';
            if (isCategorized) {
              for (const cat of r.skills) {
                children.push(new Paragraph({
                  children: [
                    new TextRun({ text: (cat.category || '') + ': ', bold: true, size: 22 }),
                    new TextRun({ text: (cat.items || []).join(', '), size: 22 })
                  ]
                }));
              }
            } else {
              children.push(new Paragraph({
                children: [new TextRun({ text: r.skills.join(' · '), size: 22 })]
              }));
            }
          }
          children.push(blankLine());
        }
        break;

      case 'experience':
        if (Array.isArray(r.experience) && r.experience.length) {
          children.push(sectionHeading('Experience'));
          for (const exp of r.experience) {
            // Title line: "Title — Company" (bold)  |right| "dates"
            children.push(new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: `${exp.title || ''} — ${exp.company || ''}`, bold: true, size: 22 }),
                new TextRun({ children: [new Tab()] }),
                new TextRun({ text: dateRange(exp.startDate, exp.endDate), size: 22 })
              ]
            }));
            if (exp.location) {
              children.push(new Paragraph({
                children: [new TextRun({ text: exp.location, italics: true, size: 20 })]
              }));
            }
            if (Array.isArray(exp.bullets)) {
              for (const b of exp.bullets) {
                children.push(new Paragraph({
                  bullet: { level: 0 },
                  children: [new TextRun({ text: b, size: 22 })]
                }));
              }
            }
            children.push(blankLine());
          }
        }
        break;

      case 'education':
        if (Array.isArray(r.education) && r.education.length) {
          children.push(sectionHeading('Education'));
          for (const ed of r.education) {
            children.push(new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                new TextRun({ text: `${ed.degree || ''}, ${ed.institution || ''}`, bold: true, size: 22 }),
                new TextRun({ children: [new Tab()] }),
                new TextRun({ text: [ed.location, ed.year].filter(Boolean).join(' · '), size: 22 })
              ]
            }));
          }
          children.push(blankLine());
        }
        break;

      case 'certifications':
        if (Array.isArray(r.certifications) && r.certifications.length) {
          children.push(sectionHeading('Certifications'));
          for (const c of r.certifications) {
            children.push(new Paragraph({
              bullet: { level: 0 },
              children: [new TextRun({ text: c, size: 22 })]
            }));
          }
          children.push(blankLine());
        }
        break;
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return Packer.toBuffer(doc);
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 24 })]
  });
}

function blankLine() {
  return new Paragraph({ children: [new TextRun({ text: '' })] });
}

module.exports = { renderMarkdown, renderPlainText, renderDocx };
