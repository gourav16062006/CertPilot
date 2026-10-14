import { CertificateTemplate } from "../types";

// Function to generate high-resolution SVG certificate templates as Data URLs
export function createSvgTemplateDataUrl(type: "academic" | "modern" | "corporate" | "minimal"): string {
  const width = 1920;
  const height = 1358; // Standard 1.414 landscape A4-ish ratio

  let svg = "";

  if (type === "academic") {
    svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#D4AF37"/>
            <stop offset="50%" stop-color="#FFF4D0"/>
            <stop offset="100%" stop-color="#AA771C"/>
          </linearGradient>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FDFBF7"/>
            <stop offset="100%" stop-color="#F7F2E7"/>
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

        <!-- Outer Double Border -->
        <rect x="50" y="50" width="${width - 100}" height="${height - 100}" fill="none" stroke="#1E293B" stroke-width="4"/>
        <rect x="66" y="66" width="${width - 132}" height="${height - 132}" fill="none" stroke="url(#goldGrad)" stroke-width="6"/>
        <rect x="78" y="78" width="${width - 156}" height="${height - 156}" fill="none" stroke="#1E293B" stroke-width="1.5"/>

        <!-- Corner Ornaments -->
        <g stroke="url(#goldGrad)" stroke-width="3" fill="none">
          <path d="M 66 160 L 160 160 L 160 66" />
          <path d="M ${width - 66} 160 L ${width - 160} 160 L ${width - 160} 66" />
          <path d="M 66 ${height - 160} L 160 ${height - 160} L 160 ${height - 66}" />
          <path d="M ${width - 66} ${height - 160} L ${width - 160} ${height - 160} L ${width - 160} ${height - 66}" />
        </g>

        <!-- Top Emblem / Seal -->
        <g transform="translate(${width / 2}, 180)">
          <circle r="44" fill="url(#goldGrad)" />
          <circle r="38" fill="#1E293B" />
          <circle r="34" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-dasharray="4,3"/>
          <path d="M -16 -12 L 0 -26 L 16 -12 L 10 16 L -10 16 Z" fill="url(#goldGrad)" opacity="0.9"/>
          <circle cx="0" cy="0" r="6" fill="#1E293B" />
        </g>

        <!-- Pre-printed Header Text in Background Graphic -->
        <text x="${width / 2}" y="290" text-anchor="middle" font-family="'Cinzel', serif" font-size="44" font-weight="700" letter-spacing="8" fill="#0F172A">
          CERTIFICATE OF ACHIEVEMENT
        </text>
        <text x="${width / 2}" y="335" text-anchor="middle" font-family="'Inter', sans-serif" font-size="18" font-weight="500" letter-spacing="4" fill="#64748B">
          THIS IS PROUDLY PRESENTED TO
        </text>

        <!-- Ornamental Divider -->
        <path d="M ${width / 2 - 220} 370 L ${width / 2 + 220} 370" stroke="url(#goldGrad)" stroke-width="2"/>
        <polygon points="${width / 2},366 ${width / 2 + 6},370 ${width / 2},374 ${width / 2 - 6},370" fill="#AA771C"/>

        <!-- Bottom Signatures Lines -->
        <g transform="translate(0, ${height - 230})">
          <!-- Left Sign -->
          <line x1="280" y1="0" x2="580" y2="0" stroke="#94A3B8" stroke-width="1.5" />
          <text x="430" y="32" text-anchor="middle" font-family="'Inter', sans-serif" font-size="16" font-weight="600" fill="#334155">Authorized Director</text>
          <text x="430" y="55" text-anchor="middle" font-family="'Inter', sans-serif" font-size="13" fill="#64748B">Executive Board</text>

          <!-- Middle Gold Seal -->
          <circle cx="${width / 2}" cy="-20" r="54" fill="url(#goldGrad)" />
          <circle cx="${width / 2}" cy="-20" r="46" fill="#0F172A" />
          <text x="${width / 2}" y="-24" text-anchor="middle" font-family="'Cinzel', serif" font-size="13" font-weight="700" fill="#FFF4D0" letter-spacing="1">OFFICIAL</text>
          <text x="${width / 2}" y="-8" text-anchor="middle" font-family="'Cinzel', serif" font-size="13" font-weight="700" fill="#FFF4D0" letter-spacing="1">VERIFIED</text>

          <!-- Right Sign -->
          <line x1="${width - 580}" y1="0" x2="${width - 280}" y2="0" stroke="#94A3B8" stroke-width="1.5" />
          <text x="${width - 430}" y="32" text-anchor="middle" font-family="'Inter', sans-serif" font-size="16" font-weight="600" fill="#334155">Program Coordinator</text>
          <text x="${width - 430}" y="55" text-anchor="middle" font-family="'Inter', sans-serif" font-size="13" fill="#64748B">Certification Committee</text>
        </g>
      </svg>
    `;
  } else if (type === "modern") {
    svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <defs>
          <linearGradient id="modGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#0284C7"/>
            <stop offset="100%" stop-color="#0F172A"/>
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38BDF8"/>
            <stop offset="100%" stop-color="#0284C7"/>
          </linearGradient>
        </defs>

        <rect width="${width}" height="${height}" fill="#FFFFFF" />

        <!-- Modern Top Left Geometric Accent -->
        <polygon points="0,0 480,0 260,180 0,180" fill="url(#modGrad)"/>
        <polygon points="490,0 550,0 350,160 290,160" fill="#38BDF8" opacity="0.8"/>
        <circle cx="210" cy="80" r="30" fill="#FFFFFF" opacity="0.15"/>

        <!-- Bottom Right Geometric Accent -->
        <polygon points="${width},${height} ${width - 480},${height} ${width - 260},${height - 180} ${width},${height - 180}" fill="url(#modGrad)"/>
        <polygon points="${width - 490},${height} ${width - 550},${height} ${width - 350},${height - 160} ${width - 290},${height - 160}" fill="#38BDF8" opacity="0.8"/>

        <!-- Clean Inner Frame -->
        <rect x="80" y="80" width="${width - 160}" height="${height - 160}" fill="none" stroke="#E2E8F0" stroke-width="2" rx="12"/>

        <text x="${width / 2}" y="270" text-anchor="middle" font-family="'Montserrat', sans-serif" font-size="46" font-weight="800" letter-spacing="6" fill="#0F172A">
          CERTIFICATE OF COMPLETION
        </text>
        <text x="${width / 2}" y="320" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="18" font-weight="500" letter-spacing="3" fill="#64748B">
          PROUDLY CONFERRED UPON
        </text>

        <!-- Divider -->
        <line x1="${width / 2 - 180}" y1="360" x2="${width / 2 + 180}" y2="360" stroke="#0284C7" stroke-width="4" stroke-linecap="round"/>

        <!-- Footer signatures -->
        <g transform="translate(0, ${height - 210})">
          <line x1="260" y1="0" x2="540" y2="0" stroke="#CBD5E1" stroke-width="2" />
          <text x="400" y="32" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="600" fill="#1E293B">Lead Instructor</text>
          <text x="400" y="55" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" fill="#64748B">Department Head</text>

          <line x1="${width - 540}" y1="0" x2="${width - 260}" y2="0" stroke="#CBD5E1" stroke-width="2" />
          <text x="${width - 400}" y="32" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="600" fill="#1E293B">Managing Director</text>
          <text x="${width - 400}" y="55" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" fill="#64748B">Global Operations</text>
        </g>
      </svg>
    `;
  } else if (type === "corporate") {
    svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <defs>
          <linearGradient id="corpNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0F172A"/>
            <stop offset="100%" stop-color="#1E3A8A"/>
          </linearGradient>
          <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F59E0B"/>
            <stop offset="100%" stop-color="#B45309"/>
          </linearGradient>
        </defs>

        <rect width="${width}" height="${height}" fill="#FAFAF9" />

        <!-- Side Color Block -->
        <rect x="0" y="0" width="80" height="${height}" fill="url(#corpNavy)"/>
        <rect x="80" y="0" width="12" height="${height}" fill="url(#copperGrad)"/>

        <!-- Top Right Corporate Motif -->
        <path d="M ${width - 220} 0 L ${width} 0 L ${width} 220 Z" fill="url(#corpNavy)" opacity="0.08"/>
        <path d="M ${width - 150} 0 L ${width} 0 L ${width} 150 Z" fill="url(#copperGrad)" opacity="0.2"/>

        <rect x="140" y="60" width="${width - 200}" height="${height - 120}" fill="none" stroke="#E7E5E4" stroke-width="1.5"/>

        <text x="${width / 2 + 40}" y="240" text-anchor="middle" font-family="'Cinzel', serif" font-size="44" font-weight="700" letter-spacing="7" fill="#0F172A">
          CERTIFICATE OF EXCELLENCE
        </text>
        <text x="${width / 2 + 40}" y="295" text-anchor="middle" font-family="'Inter', sans-serif" font-size="17" font-weight="600" letter-spacing="4" fill="#B45309">
          IN RECOGNITION OF DEDICATION & HIGH PERFORMANCE
        </text>

        <!-- Footer -->
        <g transform="translate(40, ${height - 200})">
          <line x1="280" y1="0" x2="540" y2="0" stroke="#A8A29E" stroke-width="1.5" />
          <text x="410" y="30" text-anchor="middle" font-family="'Inter', sans-serif" font-size="15" font-weight="600" fill="#292524">Chief Executive Officer</text>

          <line x1="${width - 580}" y1="0" x2="${width - 320}" y2="0" stroke="#A8A29E" stroke-width="1.5" />
          <text x="${width - 450}" y="30" text-anchor="middle" font-family="'Inter', sans-serif" font-size="15" font-weight="600" fill="#292524">Vice President</text>
        </g>
      </svg>
    `;
  } else {
    // Minimalist
    svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <rect width="${width}" height="${height}" fill="#FCFCFC" />
        <rect x="90" y="90" width="${width - 180}" height="${height - 180}" fill="none" stroke="#000000" stroke-width="1" />
        <rect x="100" y="100" width="${width - 200}" height="${height - 200}" fill="none" stroke="#E4E4E7" stroke-width="1" />

        <text x="${width / 2}" y="260" text-anchor="middle" font-family="'Cinzel', serif" font-size="42" font-weight="600" letter-spacing="10" fill="#18181B">
          CERTIFICATE OF PARTICIPATION
        </text>
        <text x="${width / 2}" y="315" text-anchor="middle" font-family="'Inter', sans-serif" font-size="16" letter-spacing="3" fill="#71717A">
          PRESENTED FOR SUCCESSFUL INVOLVEMENT
        </text>
        
        <g transform="translate(0, ${height - 210})">
          <line x1="280" y1="0" x2="520" y2="0" stroke="#A1A1AA" stroke-width="1" />
          <text x="400" y="30" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="500" fill="#27272A">Organizer</text>

          <line x1="${width - 520}" y1="0" x2="${width - 280}" y2="0" stroke="#A1A1AA" stroke-width="1" />
          <text x="${width - 400}" y="30" text-anchor="middle" font-family="'Inter', sans-serif" font-size="14" font-weight="500" fill="#27272A">Event Director</text>
        </g>
      </svg>
    `;
  }

  const encoded = encodeURIComponent(svg.trim())
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export const DEFAULT_TEMPLATES: CertificateTemplate[] = [
  {
    id: "tpl-academic-gold",
    name: "Classic Academic Gold",
    category: "Academic",
    imageUrl: createSvgTemplateDataUrl("academic"),
    width: 1920,
    height: 1358,
    createdAt: new Date().toISOString(),
    fields: [
      {
        id: "f-name",
        name: "Recipient Name",
        variable: "{{name}}",
        x: 50,
        y: 460,
        width: 1200,
        height: 90,
        fontSize: 54,
        fontFamily: "Playfair Display",
        fontWeight: "bold",
        fontStyle: "italic",
        textAlign: "center",
        textColor: "#0F172A",
        letterSpacing: 2,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "f-desc",
        name: "Completion Text",
        variable: "for exceptional accomplishment and mastery in",
        x: 50,
        y: 570,
        width: 1000,
        height: 40,
        fontSize: 22,
        fontFamily: "Inter",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#475569",
        letterSpacing: 1,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "f-course",
        name: "Course / Event",
        variable: "{{course}}",
        x: 50,
        y: 640,
        width: 1100,
        height: 70,
        fontSize: 38,
        fontFamily: "Cinzel",
        fontWeight: "bold",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#AA771C",
        letterSpacing: 3,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "f-date",
        name: "Date",
        variable: "Issued on: {{date}}",
        x: 50,
        y: 770,
        width: 600,
        height: 35,
        fontSize: 20,
        fontFamily: "Inter",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#64748B",
        letterSpacing: 1,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "f-certid",
        name: "Certificate ID",
        variable: "Credential ID: {{certificate_id}}",
        x: 50,
        y: 820,
        width: 600,
        height: 30,
        fontSize: 16,
        fontFamily: "Inter",
        fontWeight: "600",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#94A3B8",
        letterSpacing: 2,
        opacity: 0.9,
        rotation: 0,
      },
    ],
  },
  {
    id: "tpl-modern-tech",
    name: "Modern Workshop & Tech",
    category: "Workshop",
    imageUrl: createSvgTemplateDataUrl("modern"),
    width: 1920,
    height: 1358,
    createdAt: new Date().toISOString(),
    fields: [
      {
        id: "m-name",
        name: "Recipient Name",
        variable: "{{name}}",
        x: 50,
        y: 440,
        width: 1200,
        height: 90,
        fontSize: 56,
        fontFamily: "Montserrat",
        fontWeight: "800",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#0284C7",
        letterSpacing: 1,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "m-desc",
        name: "Completion Text",
        variable: "has successfully completed all intensive training modules in",
        x: 50,
        y: 550,
        width: 1000,
        height: 40,
        fontSize: 22,
        fontFamily: "Plus Jakarta Sans",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#64748B",
        letterSpacing: 1,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "m-course",
        name: "Course Title",
        variable: "{{course}}",
        x: 50,
        y: 620,
        width: 1100,
        height: 70,
        fontSize: 40,
        fontFamily: "Montserrat",
        fontWeight: "bold",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#0F172A",
        letterSpacing: 2,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "m-date",
        name: "Date",
        variable: "Completed on {{date}}",
        x: 50,
        y: 750,
        width: 500,
        height: 35,
        fontSize: 19,
        fontFamily: "Plus Jakarta Sans",
        fontWeight: "600",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#64748B",
        letterSpacing: 1,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "m-id",
        name: "Certificate ID",
        variable: "Verify: {{certificate_id}}",
        x: 50,
        y: 795,
        width: 500,
        height: 30,
        fontSize: 16,
        fontFamily: "Plus Jakarta Sans",
        fontWeight: "600",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#94A3B8",
        letterSpacing: 2,
        opacity: 0.9,
        rotation: 0,
      },
    ],
  },
  {
    id: "tpl-corporate-exec",
    name: "Corporate Recognition",
    category: "Corporate",
    imageUrl: createSvgTemplateDataUrl("corporate"),
    width: 1920,
    height: 1358,
    createdAt: new Date().toISOString(),
    fields: [
      {
        id: "c-name",
        name: "Recipient Name",
        variable: "{{name}}",
        x: 52,
        y: 410,
        width: 1100,
        height: 80,
        fontSize: 52,
        fontFamily: "Playfair Display",
        fontWeight: "bold",
        fontStyle: "italic",
        textAlign: "center",
        textColor: "#0F172A",
        letterSpacing: 1,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "c-desc",
        name: "Description",
        variable: "for outstanding professional contribution and exemplary leadership in",
        x: 52,
        y: 510,
        width: 1000,
        height: 40,
        fontSize: 21,
        fontFamily: "Inter",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#57534E",
        letterSpacing: 1,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "c-course",
        name: "Program / Milestone",
        variable: "{{course}}",
        x: 52,
        y: 575,
        width: 1000,
        height: 60,
        fontSize: 36,
        fontFamily: "Cinzel",
        fontWeight: "bold",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#B45309",
        letterSpacing: 2,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "c-date",
        name: "Date & ID",
        variable: "{{date}} • ID: {{certificate_id}}",
        x: 52,
        y: 700,
        width: 600,
        height: 35,
        fontSize: 18,
        fontFamily: "Inter",
        fontWeight: "600",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#78716C",
        letterSpacing: 1,
        opacity: 1,
        rotation: 0,
      },
    ],
  },
  {
    id: "tpl-minimalist",
    name: "Minimalist Monochrome",
    category: "Academic",
    imageUrl: createSvgTemplateDataUrl("minimal"),
    width: 1920,
    height: 1358,
    createdAt: new Date().toISOString(),
    fields: [
      {
        id: "min-name",
        name: "Recipient Name",
        variable: "{{name}}",
        x: 50,
        y: 430,
        width: 1100,
        height: 80,
        fontSize: 50,
        fontFamily: "Cinzel",
        fontWeight: "bold",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#18181B",
        letterSpacing: 4,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "min-course",
        name: "Course Title",
        variable: "{{course}}",
        x: 50,
        y: 580,
        width: 1000,
        height: 60,
        fontSize: 34,
        fontFamily: "Inter",
        fontWeight: "600",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#27272A",
        letterSpacing: 2,
        opacity: 1,
        rotation: 0,
      },
      {
        id: "min-date",
        name: "Date & ID",
        variable: "Presented {{date}} | Ref: {{certificate_id}}",
        x: 50,
        y: 710,
        width: 600,
        height: 35,
        fontSize: 17,
        fontFamily: "Inter",
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
        textColor: "#71717A",
        letterSpacing: 1,
        opacity: 1,
        rotation: 0,
      },
    ],
  },
];

// Sample recipients dataset per requirement
export const SAMPLE_RECIPIENTS = [
  {
    _id: "rec-1",
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    course: "Full Stack Development & Cloud Architecture",
    date: "14 September 2026",
    certificate_id: "WM-2026-0814",
  },
  {
    _id: "rec-2",
    name: "Priya Singh",
    email: "priya.singh@example.com",
    course: "AI & Machine Learning Engineering",
    date: "14 September 2026",
    certificate_id: "WM-2026-0815",
  },
  {
    _id: "rec-3",
    name: "Aman Kumar",
    email: "aman.kumar@example.com",
    course: "Cybersecurity & Network Defense",
    date: "14 September 2026",
    certificate_id: "WM-2026-0816",
  },
  {
    _id: "rec-4",
    name: "Sneha Patel",
    email: "sneha.patel@example.com",
    course: "UI/UX Design Systems & Product Strategy",
    date: "14 September 2026",
    certificate_id: "WM-2026-0817",
  },
  {
    _id: "rec-5",
    name: "David Chen",
    email: "david.chen@example.com",
    course: "Advanced Data Engineering with Python",
    date: "14 September 2026",
    certificate_id: "WM-2026-0818",
  },
  {
    _id: "rec-6",
    name: "Emily Watson",
    email: "emily.watson@example.com",
    course: "Cloud Native DevOps & Kubernetes",
    date: "14 September 2026",
    certificate_id: "WM-2026-0819",
  },
  {
    _id: "rec-7",
    name: "Vikram Malhotra",
    email: "vikram.malhotra@example.com",
    course: "Blockchain & Smart Contract Security",
    date: "14 September 2026",
    certificate_id: "WM-2026-0820",
  },
  {
    _id: "rec-8",
    name: "Ananya Iyer",
    email: "ananya.iyer@example.com",
    course: "Big Data Analytics & Distributed Systems",
    date: "14 September 2026",
    certificate_id: "WM-2026-0821",
  },
  {
    _id: "rec-9",
    name: "Michael Zhang",
    email: "michael.zhang@example.com",
    course: "Microservices & API Gateway Design",
    date: "14 September 2026",
    certificate_id: "WM-2026-0822",
  },
  {
    _id: "rec-10",
    name: "Sophia Martinez",
    email: "sophia.martinez@example.com",
    course: "AI Product Management & Ethical Tech",
    date: "14 September 2026",
    certificate_id: "WM-2026-0823",
  },
];
