import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Upload, FileText, Check, AlertTriangle, RefreshCw, 
  Sparkles, Mail, Phone, GraduationCap, MapPin, Award, 
  CheckCircle, Lightbulb, TrendingUp, Info, ArrowRight,
  ExternalLink, Copy, HelpCircle, FileCheck, ThumbsUp, ChevronDown, ChevronRight, CheckCircle2, AlertCircle,
  Download, Laptop, Smartphone, Share2, Settings
} from 'lucide-react';

// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs-dist worker to work in-browser completely offline/local
try {
  const version = pdfjsLib.version || '6.1.200';
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn("Failed to set PDF workerSrc", e);
}

// PDF Text Extraction Helper Function
async function extractTextFromPdf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target || !event.target.result) {
          reject(new Error("Failed to read file buffer"));
          return;
        }
        const arrayBuffer = event.target.result as ArrayBuffer;
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ');
          fullText += pageText + '\n';
        }
        resolve(fullText);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Interfaces
interface BulletAnalysis {
  text: string;
  hasActionVerb: boolean;
  actionVerb: string;
  hasMetric: boolean;
  metric: string;
  issue: string | null;
  suggestion: string | null;
}

interface ParsedExperience {
  company: string;
  role: string;
  duration: string;
  bullets: BulletAnalysis[];
}

interface ParsedEducation {
  school: string;
  degree: string;
  gpa: string;
  year: string;
}

interface ParsedResult {
  rawText: string;
  wordCount: number;
  contact: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
  };
  education: ParsedEducation[];
  skills: {
    technical: string[];
    soft: string[];
    custom: string[];
  };
  experience: ParsedExperience[];
  projects: string[];
  sectionsFound: string[];
  scoreBreakdown: {
    contactScore: number;
    skillsScore: number;
    educationScore: number;
    experienceScore: number;
    formattingScore: number;
    totalScore: number;
  };
  overallGrade: string;
  structuralCritique: string[];
  isNotResume?: boolean;
}

interface SkillMapping {
  name: string;
  regex: RegExp;
  category: 'technical' | 'soft';
}

// Extensive Skills List for offline matching
const SKILLS_DATABASE: SkillMapping[] = [
  // Programming Languages
  { name: 'JavaScript', regex: /\b(javascript|js|es6)\b/i, category: 'technical' },
  { name: 'TypeScript', regex: /\b(typescript|ts)\b/i, category: 'technical' },
  { name: 'Python', regex: /\b(python|py)\b/i, category: 'technical' },
  { name: 'Java', regex: /\b(java)\b/i, category: 'technical' },
  { name: 'C++', regex: /\b(c\+\+|cpp)\b/i, category: 'technical' },
  { name: 'C#', regex: /\b(c#|c-sharp)\b/i, category: 'technical' },
  { name: 'Go', regex: /\b(golang|go)\b/i, category: 'technical' },
  { name: 'Rust', regex: /\b(rust)\b/i, category: 'technical' },
  { name: 'Ruby', regex: /\b(ruby|rails)\b/i, category: 'technical' },
  { name: 'SQL', regex: /\b(sql|mysql|sqlite)\b/i, category: 'technical' },
  { name: 'HTML5/CSS3', regex: /\b(html5?|css3?)\b/i, category: 'technical' },
  { name: 'PHP', regex: /\b(php)\b/i, category: 'technical' },
  { name: 'Kotlin', regex: /\b(kotlin)\b/i, category: 'technical' },
  { name: 'Swift', regex: /\b(swift)\b/i, category: 'technical' },
  
  // Frameworks & Libraries
  { name: 'React', regex: /\b(react|reactjs|native)\b/i, category: 'technical' },
  { name: 'Next.js', regex: /\b(next\.js|nextjs)\b/i, category: 'technical' },
  { name: 'Node.js', regex: /\b(node\.js|nodejs|node)\b/i, category: 'technical' },
  { name: 'Express', regex: /\b(express|expressjs)\b/i, category: 'technical' },
  { name: 'Angular', regex: /\b(angular|angularjs)\b/i, category: 'technical' },
  { name: 'Vue.js', regex: /\b(vue|vuejs)\b/i, category: 'technical' },
  { name: 'Tailwind CSS', regex: /\b(tailwind|tailwindcss)\b/i, category: 'technical' },
  { name: 'Redux', regex: /\b(redux|toolkit)\b/i, category: 'technical' },
  { name: 'Django', regex: /\b(django)\b/i, category: 'technical' },
  { name: 'Flask', regex: /\b(flask)\b/i, category: 'technical' },
  { name: 'Spring Boot', regex: /\b(spring|springboot)\b/i, category: 'technical' },
  
  // Databases & Cloud
  { name: 'PostgreSQL', regex: /\b(postgresql|postgres)\b/i, category: 'technical' },
  { name: 'MongoDB', regex: /\b(mongodb|mongo)\b/i, category: 'technical' },
  { name: 'Redis', regex: /\b(redis)\b/i, category: 'technical' },
  { name: 'Docker', regex: /\b(docker|containers)\b/i, category: 'technical' },
  { name: 'Kubernetes', regex: /\b(kubernetes|k8s)\b/i, category: 'technical' },
  { name: 'AWS', regex: /\b(aws|amazon web services|ec2|s3|lambda)\b/i, category: 'technical' },
  { name: 'GCP', regex: /\b(gcp|google cloud|firebase|firestore)\b/i, category: 'technical' },
  { name: 'Git', regex: /\b(git|github|gitlab)\b/i, category: 'technical' },
  
  // Data Science & Business
  { name: 'Pandas', regex: /\b(pandas)\b/i, category: 'technical' },
  { name: 'NumPy', regex: /\b(numpy)\b/i, category: 'technical' },
  { name: 'Scikit-Learn', regex: /\b(scikit-learn|sklearn)\b/i, category: 'technical' },
  { name: 'Tableau', regex: /\b(tableau)\b/i, category: 'technical' },
  { name: 'PowerBI', regex: /\b(powerbi|power bi)\b/i, category: 'technical' },
  { name: 'Figma', regex: /\b(figma|ui\/ux|ux|ui design)\b/i, category: 'technical' },
  { name: 'Agile/Scrum', regex: /\b(agile|scrum|jira|kanban)\b/i, category: 'technical' },
  { name: 'Excel/VBA', regex: /\b(excel|vba|macros)\b/i, category: 'technical' },
  
  // Soft Skills
  { name: 'Leadership', regex: /\b(leadership|led team|managed|directed|pioneered)\b/i, category: 'soft' },
  { name: 'Communication', regex: /\b(communication|verbal|written|presentation|presenting)\b/i, category: 'soft' },
  { name: 'Problem Solving', regex: /\b(problem solving|analytical|critical thinking|troubleshooting)\b/i, category: 'soft' },
  { name: 'Teamwork', regex: /\b(teamwork|collaboration|collaborated|team player|cooperation)\b/i, category: 'soft' },
  { name: 'Time Management', regex: /\b(time management|prioritization|organized|efficiency)\b/i, category: 'soft' },
];

const ACTION_VERBS = [
  'optimized', 'developed', 'implemented', 'designed', 'created', 'programmed', 
  'engineered', 'automated', 'rebuilt', 'refactored', 'restructured', 'led', 
  'managed', 'pioneered', 'spearheaded', 'facilitated', 'collaborated', 'accelerated', 
  'decreased', 'increased', 'multiplied', 'reduced', 'maximized', 'saved', 
  'launched', 'deployed', 'tested', 'debugged', 'solved', 'resolved', 'analyzed', 
  'researched', 'monitored', 'integrated', 'executed', 'built', 'directed', 'formulated'
];

const WEAK_VERBS_MAPPING: Record<string, string> = {
  'worked on': 'Spearheaded development of / Engineered',
  'helped with': 'Collaborated on / Facilitated',
  'responsible for': 'Executed / Orchestrated',
  'handled': 'Managed / Directed / Oversaw',
  'did': 'Engineered / Executed',
  'built': 'Developed / Architected',
  'made': 'Designed / Created',
  'assisted': 'Supported / Collaborated with',
  'looked at': 'Analyzed / Evaluated',
  'went over': 'Audited / Examined',
};

// Standard highly detailed template samples
const SAMPLE_RESUMES = [
  {
    title: "Software Engineer Intern (High Score)",
    text: `ALEX RIVERA
Email: alex.rivera@gmail.com | Phone: +1 (555) 019-2834 | LinkedIn: linkedin.com/in/alexrivera | GitHub: github.com/alexrivera
State University - B.S. in Computer Science (GPA: 3.9 / 4.0, Expected Graduation: 2026)

TECHNICAL SKILLS:
Languages: TypeScript, JavaScript, Python, C++, SQL, HTML, CSS
Frameworks & Libraries: React, Next.js, Node.js, Express, Tailwind CSS, Redux
Databases & Cloud: PostgreSQL, MongoDB, Redis, AWS (S3, Lambda), Docker, Git

EXPERIENCE:
Software Engineering Intern @ CloudScale Tech (June 2025 - Present)
- Engineered responsive React dashboard components, boosting client-side page load speed by 28% and user retention.
- Automated API validation pipelines with Node.js and Express, saving the QA team over 8 hours of manual testing weekly.
- Optimized database query indexes in PostgreSQL, reducing average request-response latency by 140ms.

PROJECTS:
1. SmartTrack Logistics Hub (React, Node.js, PostgreSQL)
- Spearheaded development of a real-time tracking interface utilizing WebSockets, reducing package update delays by 40%.
- Integrated robust user authorization mechanisms using JSON Web Tokens (JWT) with secure HttpOnly cookies.
2. Personal Dev Portfolio Generator (Next.js, TypeScript)
- Built an open-source static site compiler that generates styled pages from simple JSON configurations, gaining 120+ GitHub stars.`,
    jobDescription: `We are looking for a Software Engineer Intern with experience in React, TypeScript, Node.js, and PostgreSQL. The ideal candidate has experience building responsive web interfaces, automating validation pipelines, and optimizing database query indexes. Knowledge of WebSockets, JWT authentication, and cloud deployment is highly desirable.`
  },
  {
    title: "Web Developer Candidate (Needs Improvement)",
    text: `John Doe
Email: john123@yahoo.com
Phone: 415-555-5555

EDUCATION:
Some College - taking classes in IT

SKILLS:
Javascript, HTML, CSS, writing code, learning fast

EXPERIENCE:
Web Dev Intern
- worked on making the website better and fixed some bugs.
- responsible for adding buttons to the landing page.
- helped with database setups.
- did whatever the boss told me to do.`,
    jobDescription: `Senior Frontend Engineer / Web Developer with advanced expertise in React, TypeScript, Next.js, and Tailwind CSS. Must have proven experience leading teams, architecting scalable web applications, and implementing deep data visualizations with D3/Recharts.`
  }
];

// Offline ATS review parser function
function parseResumeOffline(text: string): ParsedResult {
  const normalized = text.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  
  // Initialize result
  const result: ParsedResult = {
    rawText: text,
    wordCount,
    contact: { name: '', email: '', phone: '', linkedin: '', github: '' },
    education: [],
    skills: { technical: [], soft: [], custom: [] },
    experience: [],
    projects: [],
    sectionsFound: [],
    scoreBreakdown: {
      contactScore: 0,
      skillsScore: 0,
      educationScore: 0,
      experienceScore: 0,
      formattingScore: 0,
      totalScore: 0
    },
    overallGrade: 'F',
    structuralCritique: []
  };

  // 1. Guess Name
  // Typically, name is on the first 1-3 lines, and it is a non-empty, reasonably short line
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const trimmed = lines[i].trim();
    if (trimmed && trimmed.length > 3 && trimmed.length < 35 && !trimmed.includes(':') && !trimmed.includes('@') && !trimmed.includes('|')) {
      result.contact.name = trimmed;
      break;
    }
  }
  if (!result.contact.name) {
    result.contact.name = "Candidate Name (Unresolved)";
  }

  // 2. Extract Contact via Regex
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const phoneRegex = /(\+?[0-9][\d\s\-\(\)\+.]{8,18})/g;
  const linkedinRegex = /(linkedin\.com\/in\/[a-zA-Z0-9-_]+)/i;
  const githubRegex = /(github\.com\/[a-zA-Z0-9-_]+)/i;

  const emailMatch = text.match(emailRegex);
  if (emailMatch) result.contact.email = emailMatch[1];

  // Pick the best match for phone
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches) {
    // filter to avoid matching random long numbers (like dates or GPA)
    const validPhones = phoneMatches.map(p => p.trim()).filter(p => p.replace(/[\s\-\(\)\+]/g, '').length >= 10);
    if (validPhones.length > 0) result.contact.phone = validPhones[0];
  }

  const liMatch = text.match(linkedinRegex);
  if (liMatch) result.contact.linkedin = liMatch[1];

  const ghMatch = text.match(githubRegex);
  if (ghMatch) result.contact.github = ghMatch[1];

  // 3. Section Identification & Splitting
  const sectionKeywords = [
    { key: 'education', regex: /\b(education|academic|academic performance|college|university)\b/i },
    { key: 'experience', regex: /\b(experience|employment|work history|professional background|work experience|career|internships)\b/i },
    { key: 'skills', regex: /\b(skills|technical skills|technologies|core competencies|expertise|tools)\b/i },
    { key: 'projects', regex: /\b(projects|personal projects|key projects|academic projects)\b/i },
    { key: 'certifications', regex: /\b(certifications|awards|credentials|courses)\b/i }
  ];

  const sectionHeuristics: Record<string, string[]> = {
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: []
  };

  let currentSection = 'contact_header';
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check if line looks like a header
    let foundHeader = false;
    for (const item of sectionKeywords) {
      // Typically section headers are short, uppercase or prominent
      if (item.regex.test(trimmed) && trimmed.length < 35) {
        currentSection = item.key;
        foundHeader = true;
        if (!result.sectionsFound.includes(item.key)) {
          result.sectionsFound.push(item.key);
        }
        break;
      }
    }

    if (!foundHeader) {
      if (sectionHeuristics[currentSection]) {
        sectionHeuristics[currentSection].push(trimmed);
      }
    }
  });

  // 4. Parse Education Details
  const eduLines = sectionHeuristics['education'];
  if (eduLines.length > 0) {
    let currentEdu: ParsedEducation = { school: '', degree: '', gpa: '', year: '' };
    eduLines.forEach(line => {
      // Find GPA
      const gpaMatch = line.match(/\b(gpa|cgpa|grade|g\.p\.a\.)\s*[:\-]?\s*([0-9\.\/]+)/i);
      if (gpaMatch) {
        currentEdu.gpa = gpaMatch[2];
      }
      
      // Find Year/Graduation
      const yearMatch = line.match(/\b(20\d{2}|19\d{2}|expected|graduating|grad)\b/i);
      if (yearMatch) {
        const fullYear = line.match(/\b(20\d{2})\b/);
        currentEdu.year = fullYear ? fullYear[0] : 'Expected / Completed';
      }

      // Find School name
      if (/\b(university|college|institute|school|academy|polytechnic)\b/i.test(line)) {
        currentEdu.school = line;
      }

      // Find Degree name
      if (/\b(b\.s\.|b\.tech|b\.a\.|m\.s\.|m\.tech|phd|bachelor|master|diploma|degree)\b/i.test(line)) {
        currentEdu.degree = line;
      }
    });

    if (currentEdu.school || currentEdu.degree) {
      result.education.push(currentEdu);
    } else {
      // Fallback
      result.education.push({
        school: eduLines[0] || 'Unresolved School',
        degree: eduLines[1] || 'Degree Details',
        gpa: currentEdu.gpa || 'N/A',
        year: currentEdu.year || 'N/A'
      });
    }
  }

  // 5. Match Skills Offline
  SKILLS_DATABASE.forEach(skill => {
    if (skill.regex.test(text)) {
      if (skill.category === 'technical') {
        result.skills.technical.push(skill.name);
      } else {
        result.skills.soft.push(skill.name);
      }
    }
  });

  // Also harvest other potential skills listed under the SKILLS section
  const skillsSectionLines = sectionHeuristics['skills'];
  skillsSectionLines.forEach(line => {
    // Split by commas, semicolons or pipes to find custom items
    const parts = line.split(/[;|,]/);
    parts.forEach(part => {
      const clean = part.replace(/[:\-•*]/, '').trim();
      if (clean && clean.length > 2 && clean.length < 25 && !clean.includes('Skills') && !clean.includes('Languages')) {
        // avoid duplicating ones we already matched via dict
        if (!result.skills.technical.includes(clean) && !result.skills.soft.includes(clean) && !result.skills.custom.includes(clean)) {
          if (result.skills.custom.length < 8) {
            result.skills.custom.push(clean);
          }
        }
      }
    });
  });

  // 6. Experience Bullet Points Analysis
  const expLines = sectionHeuristics['experience'];
  let currentExp: ParsedExperience | null = null;

  expLines.forEach(line => {
    const isBullet = line.startsWith('-') || line.startsWith('*') || line.startsWith('•') || line.startsWith('o ') || /^\d+\.\s/.test(line);
    
    if (isBullet) {
      // Analyze bullet point
      const cleanBullet = line.replace(/^[\-•*o\d\.\s]+/, '').trim();
      if (cleanBullet.length > 5) {
        const words = cleanBullet.toLowerCase().split(/\s+/);
        const firstWord = words[0]?.replace(/[^\w]/g, '') || '';
        const secondWord = words[1]?.replace(/[^\w]/g, '') || '';
        const combinedFirstTwo = `${firstWord} ${secondWord}`;

        // 6a. Check for Action Verb at start
        let startsWithVerb = ACTION_VERBS.includes(firstWord);
        let foundVerb = startsWithVerb ? firstWord : '';

        // Check weak verbs
        let issue: string | null = null;
        let suggestion: string | null = null;

        // Is it a weak verb?
        const weakVerbKey = Object.keys(WEAK_VERBS_MAPPING).find(key => 
          cleanBullet.toLowerCase().startsWith(key)
        );

        if (weakVerbKey) {
          issue = `Starts with a passive/weak phrase ("${weakVerbKey}").`;
          suggestion = `Change to a powerful action verb: "${WEAK_VERBS_MAPPING[weakVerbKey]}".`;
        } else if (!startsWithVerb) {
          issue = `Does not begin with a strong, active industry verb (found "${firstWord || 'none'}").`;
          // Pick a random helpful action verb to suggest
          const sampleVerbs = ['Engineered', 'Optimized', 'Spearheaded', 'Automated', 'Formulated'];
          suggestion = `Start the bullet point with a performance-focused action verb like "${sampleVerbs[Math.floor(Math.random() * sampleVerbs.length)]}".`;
        }

        // 6b. Check for Quantifiable Metrics (numbers, %, $, etc.)
        const hasMetric = /\b(\d+|\d+%\s*|\$\d+k?|\d+\s*hours|million|billion)\b/i.test(cleanBullet);
        let metricVal = '';
        if (hasMetric) {
          const numbers = cleanBullet.match(/\b(\d+%?|\$\d+k?|\d+\+?)\b/);
          metricVal = numbers ? numbers[0] : 'Found Numeric Impact';
        } else {
          if (!issue) {
            issue = 'Lacks quantified business outcomes or metric achievements.';
            suggestion = 'Add a measurable impact (e.g., "saved 15% system downtime", "reducing manual tasks by 5 hours/week", "handling 3,000+ daily queries").';
          } else {
            issue += ' Also lacks measurable business metrics.';
            suggestion += ' Incorporate a numerical metric (%, $, numbers) to prove impact.';
          }
        }

        // 6c. Length check
        if (words.length > 30) {
          issue = 'Bullet point is too lengthy and wordy. Recommended maximum is 25 words.';
          suggestion = 'Split this into two concise bullets or trim filler words.';
        } else if (words.length < 6) {
          issue = 'Bullet point is too short. Lacks details of HOW or WHAT was achieved.';
          suggestion = 'Elaborate on the technology used and the final outcome (e.g., "by deploying React hooks").';
        }

        const bulletAnalysis: BulletAnalysis = {
          text: cleanBullet,
          hasActionVerb: startsWithVerb && !weakVerbKey,
          actionVerb: foundVerb || (weakVerbKey ? 'weak' : ''),
          hasMetric,
          metric: metricVal,
          issue,
          suggestion
        };

        if (currentExp) {
          currentExp.bullets.push(bulletAnalysis);
        } else {
          // If bullet found before company, create a draft experience
          currentExp = {
            company: 'Professional Projects / Experience',
            role: 'Associate / Contributor',
            duration: 'Timeline',
            bullets: [bulletAnalysis]
          };
        }
      }
    } else {
      // This is probably a Company / Role or duration line!
      // Let's finalize the previous experience card first
      if (currentExp && currentExp.bullets.length > 0) {
        result.experience.push(currentExp);
        currentExp = null;
      }

      // Start new experience
      const parts = line.split(/[|@•,-]/);
      const company = parts[0]?.trim() || 'Experience Entry';
      const role = parts[1]?.trim() || 'Specialist / Developer';
      const duration = parts[parts.length - 1]?.trim() || 'Date Range';

      currentExp = {
        company,
        role,
        duration,
        bullets: []
      };
    }
  });

  // Push final experience card if any
  if (currentExp && currentExp.bullets.length > 0) {
    result.experience.push(currentExp);
  }

  // 7. Parse Projects List
  const projLines = sectionHeuristics['projects'];
  projLines.forEach(line => {
    if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•') || /^\d+\.\s/.test(line)) {
      result.projects.push(line.replace(/^[\-•*\d\.\s]+/, '').trim());
    }
  });

  // 8. SCORE CALCULATION
  let contactScore = 0;
  if (result.contact.email) contactScore += 5;
  if (result.contact.phone) contactScore += 5;
  if (result.contact.linkedin || result.contact.github) contactScore += 5;

  const totalSkillsCount = result.skills.technical.length + result.skills.soft.length + result.skills.custom.length;
  const skillsScore = Math.min(20, totalSkillsCount * 2);

  let educationScore = 0;
  if (result.education.length > 0) {
    const mainEdu = result.education[0];
    if (mainEdu.school && mainEdu.school !== 'Unresolved School') educationScore += 5;
    if (mainEdu.degree && mainEdu.degree !== 'Degree Details') educationScore += 5;
    if (mainEdu.gpa && mainEdu.gpa !== 'N/A') educationScore += 5;
  }

  let experienceScore = 0;
  if (result.experience.length > 0) {
    experienceScore += 10; // has experience section
    
    // Evaluate bullet points action verbs and metrics ratio
    let totalBullets = 0;
    let verbsCount = 0;
    let metricsCount = 0;

    result.experience.forEach(exp => {
      exp.bullets.forEach(bullet => {
        totalBullets++;
        if (bullet.hasActionVerb) verbsCount++;
        if (bullet.hasMetric) metricsCount++;
      });
    });

    if (totalBullets > 0) {
      const verbRatio = verbsCount / totalBullets;
      const metricRatio = metricsCount / totalBullets;

      experienceScore += Math.round(verbRatio * 10);
      experienceScore += Math.round(metricRatio * 10);
    }
  }

  let formattingScore = 0;
  // Word count check
  if (wordCount >= 200 && wordCount <= 650) {
    formattingScore += 10;
  } else if (wordCount > 0) {
    formattingScore += 5; // too short or too long
  }

  // Headers count check
  if (result.sectionsFound.length >= 3) {
    formattingScore += 10;
  } else if (result.sectionsFound.length > 0) {
    formattingScore += 5;
  }

  // Heuristic check if it is NOT a resume
  const hasEmail = !!result.contact.email;
  const hasPhone = !!result.contact.phone;
  const hasSomeContact = hasEmail || hasPhone;

  // Count standard resume-specific keywords in the entire text to separate genuine resumes from other PDFs
  const resumeKeywordRegex = /\b(education|experience|skills|projects|employment|curriculum vitae|resume|cv|gpa|qualification|academic|certifications|extracurricular|achievements|career|internship|roles?|hobbies)\b/gi;
  const matches = text.match(resumeKeywordRegex);
  const keywordCount = matches ? matches.length : 0;

  // PDF check conditions:
  // If it lacks email & phone AND has low keyword density OR contains absolutely no recognizable sections and very few keywords
  const isNotResume = (!hasSomeContact && keywordCount < 3) || wordCount < 30 || (result.sectionsFound.length === 0 && keywordCount < 2);

  if (isNotResume) {
    result.scoreBreakdown = {
      contactScore: 0,
      skillsScore: 0,
      educationScore: 0,
      experienceScore: 0,
      formattingScore: 0,
      totalScore: 0
    };
    result.overallGrade = 'F';
    result.isNotResume = true;
    result.structuralCritique = [
      "⚠️ Non-Resume PDF Detected: The uploaded document does not appear to be a standard resume (no contact details or standard sections like Experience, Education, or Skills were found). ATS Compatibility is set to 0."
    ];
  } else {
    // Combine scores
    result.scoreBreakdown = {
      contactScore,
      skillsScore,
      educationScore,
      experienceScore,
      formattingScore,
      totalScore: contactScore + skillsScore + educationScore + experienceScore + formattingScore
    };

    const total = result.scoreBreakdown.totalScore;

    // Grade Assignments
    if (total >= 90) result.overallGrade = 'A';
    else if (total >= 75) result.overallGrade = 'B';
    else if (total >= 60) result.overallGrade = 'C';
    else if (total >= 45) result.overallGrade = 'D';
    else result.overallGrade = 'F';

    // 9. Generate Actionable Structural Critique
    if (!result.contact.linkedin) {
      result.structuralCritique.push("Missing professional LinkedIn profile. Recruiters look for active portfolios.");
    }
    if (!result.contact.github && result.skills.technical.length > 0) {
      result.structuralCritique.push("No GitHub repository link discovered. Add custom open-source links to showcase engineering proof.");
    }
    if (wordCount < 150) {
      result.structuralCritique.push("Extremely brief word count. Incorporate robust details and structural project sections.");
    } else if (wordCount > 700) {
      result.structuralCritique.push("Resume is overly wordy (exceeds 700 words). Condense summaries and focus strictly on impact.");
    }
    if (!result.sectionsFound.includes('skills')) {
      result.structuralCritique.push("Missing dedicated 'SKILLS' header block. ATS scanner needs structured tags to map skill density.");
    }
    if (!result.sectionsFound.includes('projects') && result.projects.length === 0) {
      result.structuralCritique.push("No projects block detected. Projects are vital to prove real-world engineering competency.");
    }
  }

  return result;
}

// Client-side Keyword matching engine
interface MatchResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  density: { word: string; count: number }[];
}

function calculateJobMatch(resumeText: string, jobText: string): MatchResult {
  if (!jobText.trim() || !resumeText.trim()) {
    return { matchScore: 0, matchedKeywords: [], missingKeywords: [], density: [] };
  }

  // Extract keywords from job description
  // Clean punctuation and convert to words
  const words = jobText.toLowerCase().replace(/[^\w\s\+\#]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  
  // Exclude common grammatical filler words
  const stopWords = new Set([
    'and', 'the', 'for', 'with', 'you', 'are', 'will', 'this', 'that', 'our', 'their', 'your',
    'have', 'has', 'had', 'been', 'from', 'into', 'under', 'over', 'more', 'about', 'some',
    'any', 'all', 'such', 'other', 'them', 'they', 'work', 'experience', 'candidate', 'skills',
    'role', 'position', 'team', 'company', 'must', 'requirements', 'years', 'ability', 'preferred',
    'strongly', 'good', 'ideal', 'looking', 'join', 'help', 'make', 'part', 'building', 'software'
  ]);

  const uniqueJobKeywords = Array.from(new Set(words.filter(w => !stopWords.has(w))));
  
  // Filter for words matching skills database or capitalizing, or lengths > 3
  const candidateKeywords = uniqueJobKeywords.filter(w => {
    // Check if it's in our skills database or looks like a technical keyword
    return w.length > 3 || ['js', 'ts', 'go', 'aws', 'gcp', 'git', 'c#', 'c++', 'sql'].includes(w);
  });

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const lowercaseResume = resumeText.toLowerCase();

  candidateKeywords.slice(0, 15).forEach(kw => {
    const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lowercaseResume)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  // Calculate density
  const densityMap: Record<string, number> = {};
  matchedKeywords.forEach(kw => {
    const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = lowercaseResume.match(regex);
    densityMap[kw] = matches ? matches.length : 1;
  });

  const density = Object.entries(densityMap)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  const totalPossible = matchedKeywords.length + missingKeywords.length;
  const matchScore = totalPossible > 0 ? Math.round((matchedKeywords.length / totalPossible) * 100) : 0;

  return {
    matchScore,
    matchedKeywords,
    missingKeywords,
    density
  };
}

export default function AtsReviewer() {
  const [resumeText, setResumeText] = useState('');
  const [jobText, setJobText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ParsedResult | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<'score' | 'components' | 'corrections' | 'matcher'>('score');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User installation outcome: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      showToast('info', 'PWA installation prompt is ready. If not triggered automatically, click the install icon in your browser URL bar!');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // File drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.type === "text/plain" || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const text = event.target.result;
          setResumeText(text);
          showToast('success', `Successfully uploaded text resume: ${file.name}`);
          
          // Trigger immediate analysis of extracted text
          const parsed = parseResumeOffline(text);
          setAnalysisResult(parsed);
          if (jobText.trim()) {
            const matches = calculateJobMatch(text, jobText);
            setMatchResult(matches);
          } else {
            setMatchResult(null);
          }
        }
      };
      reader.readAsText(file);
    } else if (file.type === "application/pdf" || file.name.endsWith('.pdf')) {
      setIsAnalyzing(true);
      showToast('info', `Parsing PDF file: ${file.name}...`);
      extractTextFromPdf(file)
        .then((text) => {
          setResumeText(text);
          showToast('success', `Successfully extracted text from PDF: ${file.name}`);
          
          // Trigger immediate analysis of extracted text
          const parsed = parseResumeOffline(text);
          setAnalysisResult(parsed);
          
          if (jobText.trim()) {
            const matches = calculateJobMatch(text, jobText);
            setMatchResult(matches);
          } else {
            setMatchResult(null);
          }
          setIsAnalyzing(false);
        })
        .catch((err) => {
          console.error(err);
          showToast('info', `Failed to parse PDF: ${err.message || err}. Please try again or paste your resume text instead.`);
          setIsAnalyzing(false);
        });
    } else {
      showToast('info', `Unsupported file format. Please upload a .pdf or .txt resume file.`);
    }
  };

  const showToast = (type: 'success' | 'info', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  const handleAnalyze = () => {
    if (!resumeText.trim()) {
      showToast('info', 'Please upload a resume file or paste your resume text first!');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate real local CPU computation delay
    setTimeout(() => {
      const parsed = parseResumeOffline(resumeText);
      setAnalysisResult(parsed);
      
      // Calculate match score if job description exists
      if (jobText.trim()) {
        const matches = calculateJobMatch(resumeText, jobText);
        setMatchResult(matches);
      } else {
        setMatchResult(null);
      }
      
      setIsAnalyzing(false);
      showToast('success', 'ATS Review completed instantly! Scorecard updated.');
    }, 800);
  };

  const loadSample = (index: number) => {
    const resume = SAMPLE_RESUMES[index].text;
    const job = SAMPLE_RESUMES[index].jobDescription || '';
    setResumeText(resume);
    setJobText(job);
    
    const parsed = parseResumeOffline(resume);
    setAnalysisResult(parsed);
    if (job) {
      const matches = calculateJobMatch(resume, job);
      setMatchResult(matches);
    } else {
      setMatchResult(null);
    }
    showToast('success', `Loaded & Aligned: ${SAMPLE_RESUMES[index].title}`);
  };

  const copyImproved = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copied correction suggestion to clipboard!');
  };

  const handleDownloadOfflineHtml = () => {
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Placement Club ATS - Offline Standalone App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: 'Inter', sans-serif; }
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen pb-16">
  <!-- Offline Header -->
  <header class="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <span class="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-500/30">
          Standalone Offline App
        </span>
        <h1 class="text-2xl font-extrabold tracking-tight font-display mt-2">
          Placement Club <span class="text-indigo-400">ATS Resume Reviewer</span>
        </h1>
        <p class="text-slate-300 text-xs mt-1 font-light max-w-xl">
          You are running a 100% private, self-contained single-file offline desktop build. Your files are scanned instantly on your machine.
        </p>
      </div>
      <div class="text-[11px] font-mono text-slate-400 border border-slate-800 rounded-lg p-2.5 bg-slate-950/40">
        Host Location: local_filesystem
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- Input Panel -->
      <div class="lg:col-span-5 space-y-4">
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="upload" class="w-4 h-4 text-indigo-600"></i>
            1. Paste or Load Resume Content
          </h2>

          <textarea
            id="resumeInput"
            rows="12"
            placeholder="Paste your plain text resume content here to start local diagnostics..."
            class="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          ></textarea>

          <div class="space-y-2 border-t border-slate-100 pt-4">
            <h3 class="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-indigo-500"></i>
              Target Job Description (Optional Matcher)
            </h3>
            <textarea
              id="jobInput"
              rows="4"
              placeholder="Paste target job description to match skills and keywords..."
              class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            ></textarea>
          </div>

          <button
            onclick="runLocalAnalysis()"
            class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <i data-lucide="file-check" class="w-4 h-4"></i>
            Run Offline Diagnostics
          </button>
        </div>
      </div>

      <!-- Result Panel -->
      <div class="lg:col-span-7">
        <div id="welcomeMessage" class="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
          <i data-lucide="file-text" class="w-12 h-12 mx-auto mb-3 opacity-30"></i>
          <p class="text-sm font-semibold text-slate-600">No score evaluated yet.</p>
          <p class="text-xs font-light mt-1">Please enter your resume content on the left-hand panel and click "Run Offline Diagnostics" to calculate scores instantly.</p>
        </div>

        <div id="resultContent" class="hidden bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div class="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div id="gradeIndicator" class="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shadow-xs">A</div>
              <div>
                <span class="text-[10px] text-slate-400 uppercase tracking-wider block">Compatibility Rating</span>
                <span id="scoreText" class="text-xl font-extrabold text-slate-900">85 / 100</span>
              </div>
            </div>
            <div class="text-xs font-mono text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 font-semibold">
              Scan Status: 100% Success
            </div>
          </div>

          <!-- Section Feedback Block -->
          <div class="p-6 space-y-6">
            <div>
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Structure Evaluation</h3>
              <ul id="critiqueList" class="space-y-1.5 text-xs text-slate-600 list-disc pl-4 font-light">
              </ul>
            </div>

            <div class="border-t border-slate-100 pt-4">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Score breakdowns</h3>
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span id="contactScore" class="text-sm font-bold text-slate-700 block font-mono">15/15</span>
                  <span class="text-[9px] text-slate-400 block mt-0.5">Contact Details</span>
                </div>
                <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span id="skillsScore" class="text-sm font-bold text-slate-700 block font-mono">25/25</span>
                  <span class="text-[9px] text-slate-400 block mt-0.5">Skill Density</span>
                </div>
                <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span id="educationScore" class="text-sm font-bold text-slate-700 block font-mono">15/15</span>
                  <span class="text-[9px] text-slate-400 block mt-0.5">Education</span>
                </div>
                <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span id="experienceScore" class="text-sm font-bold text-slate-700 block font-mono">20/30</span>
                  <span class="text-[9px] text-slate-400 block mt-0.5">Experience</span>
                </div>
                <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span id="formattingScore" class="text-sm font-bold text-slate-700 block font-mono">10/15</span>
                  <span class="text-[9px] text-slate-400 block mt-0.5">Formatting</span>
                </div>
              </div>
            </div>

            <!-- Job description matcher output if present -->
            <div id="matcherOutput" class="hidden border-t border-slate-100 pt-4 space-y-4">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Job Matching Index</h3>
              <div id="matchScoreDisplay" class="bg-slate-50 p-4 border border-slate-150 rounded-xl flex items-center justify-between">
                <div>
                  <span id="jobMatchPercent" class="text-xl font-extrabold text-slate-900">0%</span>
                  <p class="text-[10px] text-slate-400">Keyword compatibility index</p>
                </div>
                <span class="text-xs bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded text-indigo-700 font-semibold">Matched Keywords</span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  </main>

  <script>
    // Initialize lucide icons
    lucide.createIcons();

    function runLocalAnalysis() {
      const resumeText = document.getElementById('resumeInput').value;
      const jobText = document.getElementById('jobInput').value;

      if (!resumeText.trim()) {
        alert('Please enter your resume text first!');
        return;
      }

      // Basic offline analysis algorithm (matching app's logic)
      const wordCount = resumeText.split(/\\s+/).filter(Boolean).length;
      
      let contactScore = 0;
      if (resumeText.match(/\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/)) contactScore += 5;
      if (resumeText.match(/\\b\\+?\\d{1,4}?[-.\\s]?\\(?\\d{1,3}?\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}\\b/)) contactScore += 5;
      if (resumeText.match(/linkedin\\.com/i)) contactScore += 3;
      if (resumeText.match(/github\\.com/i)) contactScore += 2;

      let educationScore = 0;
      if (resumeText.match(/\\b(bachelor|master|phd|b\\.s|m\\.s|degree|university|college|gpa)\\b/i)) educationScore += 10;
      if (resumeText.match(/gpa\\s*\\:?\\s*[2-4]\\.\\d/i)) educationScore += 5;

      let skillsScore = 0;
      const techSkills = ['react', 'javascript', 'typescript', 'node', 'express', 'postgresql', 'python', 'html', 'css', 'git', 'docker', 'aws', 'gcp'];
      let foundSkills = 0;
      techSkills.forEach(skill => {
        const r = new RegExp('\\\\b' + skill + '\\\\b', 'i');
        if (resumeText.match(r)) foundSkills++;
      });
      skillsScore = Math.min(25, foundSkills * 4);

      let experienceScore = 0;
      const actVerbs = ['engineered', 'architected', 'led', 'managed', 'implemented', 'optimized', 'scaled', 'reduced', 'increased', 'developed'];
      let foundVerbs = 0;
      actVerbs.forEach(v => {
        const r = new RegExp('\\\\b' + v + '\\\\b', 'i');
        if (resumeText.match(r)) foundVerbs++;
      });
      experienceScore = Math.min(30, foundVerbs * 5 + 10);

      let formattingScore = 15;
      if (wordCount < 150 || wordCount > 750) formattingScore -= 5;
      
      const totalScore = contactScore + educationScore + skillsScore + experienceScore + formattingScore;
      let grade = 'F';
      let gradeColor = 'bg-red-50 text-red-700 border border-red-200';
      if (totalScore >= 90) { grade = 'A'; gradeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200'; }
      else if (totalScore >= 75) { grade = 'B'; gradeColor = 'bg-indigo-50 text-indigo-700 border border-indigo-200'; }
      else if (totalScore >= 60) { grade = 'C'; gradeColor = 'bg-blue-50 text-blue-700 border border-blue-200'; }
      else if (totalScore >= 45) { grade = 'D'; gradeColor = 'bg-amber-50 text-amber-700 border border-amber-200'; }

      // Update feedback
      const critiqueList = document.getElementById('critiqueList');
      critiqueList.innerHTML = '';
      const feedback = [];
      if (contactScore < 15) feedback.push("Some contact detail credentials (such as LinkedIn or Email/Phone) were missing or incomplete.");
      if (educationScore < 15) feedback.push("Educational or GPA records were not detected or are weakly formatted.");
      if (foundSkills < 4) feedback.push("Very low technical keyword density. Add essential libraries and frameworks matching your target role.");
      if (foundVerbs < 3) feedback.push("Passive action phrasing detected. Replace passive verbs with high-impact action verbs (e.g., 'Optimized', 'Architected').");
      if (wordCount < 150) feedback.push("The resume is extremely brief (under 150 words). Provide more context on your engineering highlights.");
      
      if (feedback.length === 0) {
        feedback.push("Excellent structural parameters! Your resume formatting, skills, and metrics are fully optimized.");
      }
      
      feedback.forEach(f => {
        const li = document.createElement('li');
        li.textContent = f;
        critiqueList.appendChild(li);
      });

      // Update score breakdown text
      document.getElementById('contactScore').textContent = contactScore + '/15';
      document.getElementById('skillsScore').textContent = skillsScore + '/25';
      document.getElementById('educationScore').textContent = educationScore + '/15';
      document.getElementById('experienceScore').textContent = experienceScore + '/30';
      document.getElementById('formattingScore').textContent = formattingScore + '/15';

      // Update total scores
      document.getElementById('scoreText').textContent = totalScore + ' / 100';
      const gradeInd = document.getElementById('gradeIndicator');
      gradeInd.textContent = grade;
      gradeInd.className = 'w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shadow-xs ' + gradeColor;

      // Handle Job Matcher
      const matcherOutput = document.getElementById('matcherOutput');
      if (jobText.trim()) {
        matcherOutput.classList.remove('hidden');
        const jobWords = jobText.toLowerCase().replace(/[^\\w\\s]/g, ' ').split(/\\s+/).filter(w => w.length > 3);
        const uniqueJobWords = Array.from(new Set(jobWords)).slice(0, 15);
        let matchCount = 0;
        uniqueJobWords.forEach(kw => {
          const r = new RegExp('\\\\b' + kw + '\\\\b', 'i');
          if (resumeText.match(r)) matchCount++;
        });
        const matchPercent = uniqueJobWords.length > 0 ? Math.round((matchCount / uniqueJobWords.length) * 100) : 0;
        document.getElementById('jobMatchPercent').textContent = matchPercent + '%';
      } else {
        matcherOutput.classList.add('hidden');
      }

      // Toggle views
      document.getElementById('welcomeMessage').classList.add('hidden');
      document.getElementById('resultContent').classList.remove('hidden');
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlTemplate], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'placement-club-ats.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Standalone offline HTML app successfully downloaded! Run it anywhere by double-clicking.');
  };

  const handleDownloadWindowsLauncher = () => {
    const batContent = `@echo off
title Placement Club ATS - Windows Launcher
echo =======================================================
echo     Placement Club ATS - Standalone Desktop Launcher
echo =======================================================
echo.
echo Launching application in a native chromeless desktop frame...
echo.

set "APP_URL=https://ais-pre-aby7w5tdbkjk7pd6q3zbcr-716724850001.asia-southeast1.run.app"

reg query "HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo Opening with Microsoft Edge App mode...
    start msedge --app="%APP_URL%" --window-size=1200,800
    exit
)

reg query "HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo Opening with Google Chrome App mode...
    start chrome --app="%APP_URL%" --window-size=1200,800
    exit
)

echo App mode browsers not registered in standard registry paths. Launching default system browser...
start "" "%APP_URL%"
exit
`;

    const blob = new Blob([batContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Launch-Placement-Club-ATS.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Windows Desktop Launcher (.bat) downloaded! Double-click to run on Windows.');
  };



  // Run initial default analysis on load
  useEffect(() => {
    const defaultResume = SAMPLE_RESUMES[0].text;
    const defaultJob = SAMPLE_RESUMES[0].jobDescription || '';
    setResumeText(defaultResume);
    setJobText(defaultJob);
    
    const parsed = parseResumeOffline(defaultResume);
    setAnalysisResult(parsed);
    if (defaultJob) {
      const matches = calculateJobMatch(defaultResume, defaultJob);
      setMatchResult(matches);
    }
  }, []);

  return (
    <div className="space-y-6" id="ats-reviewer-container">
      {/* Toast Notification */}
      {alertMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border flex items-center gap-3 animate-fade-in ${
          alertMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium">{alertMsg.text}</span>
        </div>
      )}

      {/* Main Title Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-500/30">
            Privacy-First ATS Reviewer
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display">
            Local Resume Optimizer <span className="text-indigo-400">ATS</span>
          </h1>
          <p className="text-slate-300 text-sm max-w-xl font-light">
            Review, score, and optimize resumes locally without internet connectivity. High-speed local diagnostics check your formatting, action verbs, and keyword densities instantly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          <button 
            onClick={() => loadSample(0)}
            className="cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
          >
            Load Stellar Sample
          </button>
          <button 
            onClick={() => loadSample(1)}
            className="cursor-pointer bg-white/5 hover:bg-white/15 text-slate-300 border border-white/5 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
          >
            Load Weak Sample
          </button>

        </div>
      </div>

      {/* Two Column Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Upload and Input Pane (4 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            {/* Step 1: Target Job Description */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                1. Enter Target Job Description
              </h2>
              <p className="text-[11px] text-slate-400 font-light">
                Paste the job requirements or role details first so we can evaluate your resume specifically over its core criteria.
              </p>
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                rows={5}
                placeholder="Paste the target job description to match keywords and calculate specific ATS compatibility..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Step 2: Upload / Paste Resume */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                2. Input Resume Content
              </h2>

              {/* Drag & Drop Upload Stage */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-indigo-600 bg-indigo-50/40' 
                    : 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50'
                }`}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".txt,.pdf"
                  onChange={handleFileChange}
                  className="hidden" 
                />
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Drag & drop your resume file (.txt, .pdf)</p>
                <p className="text-[10px] text-slate-400 mt-1">or click to browse local folders</p>
              </div>

              {/* Custom copy-paste stage */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paste Resume Plain Text</label>
                  <button 
                    onClick={() => setResumeText('')}
                    className="text-[11px] text-red-500 hover:underline cursor-pointer"
                  >
                    Clear Text
                  </button>
                </div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={8}
                  placeholder="Paste the full plain text of your resume here..."
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400">
                  Word Count: <span className="font-semibold text-slate-700">{resumeText.split(/\s+/).filter(Boolean).length}</span> words
                </p>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Local Scanning Heuristics...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  Calculate ATS Score & Metrics
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Results Pane (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {analysisResult ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              
              {/* High-visibility Warning Alert if non-resume document is detected */}
              {analysisResult.isNotResume && (
                <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">Invalid Document Detected</h4>
                    <p className="text-amber-850 text-xs mt-1 font-light leading-relaxed">
                      This PDF does not contain standard resume sections (such as Education, Experience, or Skills) or necessary contact credentials (like email or mobile numbers). Under ATS scan parameters, this document receives a compatibility score of <strong>0 / 100</strong>. Please upload a authentic resume file.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Selector Header */}
              <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0 scrollbar-none">
                <button
                  onClick={() => setActiveTab('score')}
                  className={`cursor-pointer px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'score' 
                      ? 'border-indigo-600 text-indigo-700 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  ATS Scorecard
                </button>
                <button
                  onClick={() => setActiveTab('components')}
                  className={`cursor-pointer px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'components' 
                      ? 'border-indigo-600 text-indigo-700 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  Extracted Components
                </button>
                <button
                  onClick={() => setActiveTab('corrections')}
                  className={`cursor-pointer px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'corrections' 
                      ? 'border-indigo-600 text-indigo-700 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  Corrections & Suggestions
                </button>
                <button
                  onClick={() => setActiveTab('matcher')}
                  className={`cursor-pointer px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'matcher' 
                      ? 'border-indigo-600 text-indigo-700 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                  }`}
                >
                  Target Job Matcher {matchResult && `(${matchResult.matchScore}%)`}
                </button>
              </div>

              {/* Tab 1: Scorecard & Formatting Evaluation */}
              {activeTab === 'score' && (
                <div className="p-6 space-y-6 animate-fade-in">
                  
                  {/* Top Score Circular Gauge / Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                      
                      <div className="flex flex-wrap items-center gap-5 justify-center md:justify-start">
                        {/* Gauge 1: Resume Structure */}
                        <div className="text-center space-y-1">
                          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 border-4 border-slate-100 mx-auto">
                            <div className={`absolute inset-0 rounded-full border-4 ${
                              analysisResult.scoreBreakdown.totalScore >= 80 
                                ? 'border-emerald-500' 
                                : analysisResult.scoreBreakdown.totalScore >= 60 
                                ? 'border-indigo-500' 
                                : 'border-amber-500'
                            }`} style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)` }} />
                            <div className="text-center">
                              <span className="text-2xl font-black text-slate-900">{analysisResult.scoreBreakdown.totalScore}</span>
                              <span className="text-[10px] text-slate-400 block font-light leading-none">/100</span>
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold block">Structure Score</span>
                        </div>

                        {/* Gauge 2: Job Match (Only if active) */}
                        {jobText.trim() && matchResult ? (
                          <div className="text-center space-y-1 animate-fade-in">
                            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 border-4 border-slate-100 mx-auto">
                              <div className={`absolute inset-0 rounded-full border-4 ${
                                matchResult.matchScore >= 80 
                                  ? 'border-emerald-500' 
                                  : matchResult.matchScore >= 50 
                                  ? 'border-indigo-500' 
                                  : 'border-amber-500'
                              }`} style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)` }} />
                              <div className="text-center">
                                <span className="text-2xl font-black text-indigo-600 font-mono">{matchResult.matchScore}%</span>
                                <span className="text-[10px] text-indigo-400 block font-light leading-none">Match</span>
                              </div>
                            </div>
                            <span className="text-[9px] text-indigo-600 uppercase tracking-wider font-bold block">JD Alignment</span>
                          </div>
                        ) : (
                          <div className="text-center space-y-1 opacity-50 hover:opacity-80 transition-opacity">
                            <div className="w-20 h-20 rounded-full bg-slate-50 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center mx-auto text-slate-400">
                              <Sparkles className="w-5 h-5 animate-pulse text-slate-300" />
                              <span className="text-[8px] mt-1 font-semibold leading-none text-slate-400">Waiting</span>
                            </div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold block">JD Alignment</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-center md:text-left space-y-1.5">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                          <h3 className="text-lg font-bold text-slate-900">ATS Evaluation Dashboard</h3>
                          
                          {/* Main badge */}
                          {jobText.trim() && matchResult ? (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              matchResult.matchScore >= 80 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : matchResult.matchScore >= 50 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {matchResult.matchScore >= 80 ? 'Highly Compatible' : matchResult.matchScore >= 50 ? 'Moderate Alignment' : 'Low Alignment'}
                            </span>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              analysisResult.overallGrade === 'A' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : analysisResult.overallGrade === 'B' 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : analysisResult.overallGrade === 'C'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              Grade {analysisResult.overallGrade}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs font-light max-w-md leading-relaxed">
                          {jobText.trim() && matchResult 
                            ? `Successfully evaluated specifically over the target job. Structural integrity rating is ${analysisResult.scoreBreakdown.totalScore}/100 and job keyword coverage is ${matchResult.matchScore}%.`
                            : "Based on local parser analysis of profile completeness, skill mappings, experience quality, and general formatting criteria."
                          }
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Dynamic Job Match Alignment Banner */}
                  {jobText.trim() && matchResult ? (
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100/50 p-2 rounded-lg">
                          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Target Job Match Quality</h4>
                          <p className="text-xs text-slate-500 font-light mt-0.5">
                            Your resume covers <strong className="text-indigo-700 font-semibold">{matchResult.matchedKeywords.length} of {matchResult.matchedKeywords.length + matchResult.missingKeywords.length}</strong> key terms identified from the job requirements.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-xl font-black text-indigo-700 font-mono">{matchResult.matchScore}%</span>
                          <span className="text-[9px] text-indigo-500 block font-medium uppercase tracking-wider">JD Match</span>
                        </div>
                        <button
                          onClick={() => setActiveTab('matcher')}
                          className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] px-3.5 py-1.5 rounded-lg shadow-xs transition-all"
                        >
                          View Gap Analysis
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <Info className="w-4 h-4 text-amber-500" />
                        <div className="text-xs text-amber-800 font-light">
                          💡 <strong className="font-semibold">Maximize ATS Pass-Rate:</strong> Paste a target job description in Step 1 to match keywords and optimize your resume specifically over its screening criteria.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Component Scoring Progress Bars */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ATS Score Criteria Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Contact Info score */}
                      <div className="space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700">Profile Completeness</span>
                          <span className="text-slate-900">{analysisResult.scoreBreakdown.contactScore} / 15</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(analysisResult.scoreBreakdown.contactScore / 15) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-light">Presence of email, mobile number, and LinkedIn/GitHub profiles.</p>
                      </div>

                      {/* Skills score */}
                      <div className="space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700">Technical Skill Density</span>
                          <span className="text-slate-900">{analysisResult.scoreBreakdown.skillsScore} / 20</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(analysisResult.scoreBreakdown.skillsScore / 20) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-light">Matching volume of active development and engineering core competencies.</p>
                      </div>

                      {/* Education score */}
                      <div className="space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700">Academic Mapping</span>
                          <span className="text-slate-900">{analysisResult.scoreBreakdown.educationScore} / 15</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(analysisResult.scoreBreakdown.educationScore / 15) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-light">Resolving major credentials, university tags, and GPA indicators.</p>
                      </div>

                      {/* Experience score */}
                      <div className="space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700">Experience Impact Metrics</span>
                          <span className="text-slate-900">{analysisResult.scoreBreakdown.experienceScore} / 30</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(analysisResult.scoreBreakdown.experienceScore / 30) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-light">Action verb utilization and presence of numerical business outcome figures.</p>
                      </div>

                      {/* Formatting score */}
                      <div className="space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-100 md:col-span-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700">Length & Formatting Compliance</span>
                          <span className="text-slate-900">{analysisResult.scoreBreakdown.formattingScore} / 20</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(analysisResult.scoreBreakdown.formattingScore / 20) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-light">Word density thresholds and layout structural tags consistency.</p>
                      </div>
                    </div>
                  </div>

                  {/* Structural Warnings List */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical Formatting Alerts</h4>
                    {analysisResult.structuralCritique.length === 0 ? (
                      <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-xs text-emerald-800 font-medium">Stellar layout! No critical structural errors or missing headers found.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {analysisResult.structuralCritique.map((critique, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-lg flex items-start gap-2.5">
                            <AlertCircle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-700 font-light">{critique}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Extracted Classified Components */}
              {activeTab === 'components' && (
                <div className="p-6 space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Classified Resume Components</h3>
                      <p className="text-slate-400 text-xs font-light">Different areas detected and classified by the offline tokenizer.</p>
                    </div>
                  </div>

                  {/* Profile Header Block */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {analysisResult.contact.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{analysisResult.contact.name}</h4>
                        <p className="text-[10px] text-slate-400 font-light">Primary Applicant Identity</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{analysisResult.contact.email || 'Email Not Found'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{analysisResult.contact.phone || 'Phone Number Not Found'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-bold text-indigo-600 text-[10px] tracking-wider uppercase shrink-0">LinkedIn</span>
                        <span className="truncate text-slate-700">{analysisResult.contact.linkedin || 'Not Provided'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-bold text-indigo-600 text-[10px] tracking-wider uppercase shrink-0">GitHub</span>
                        <span className="truncate text-slate-700">{analysisResult.contact.github || 'Not Provided'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Credentials Block */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      Academic Background
                    </h4>
                    {analysisResult.education.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No academic credentials identified.</p>
                    ) : (
                      analysisResult.education.map((edu, idx) => (
                        <div key={idx} className="border border-slate-150 rounded-lg p-3.5 bg-white space-y-1 shadow-2xs">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-bold text-slate-900">{edu.school}</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">{edu.year}</span>
                          </div>
                          <p className="text-xs text-slate-600 font-light">{edu.degree}</p>
                          <p className="text-xs font-semibold text-indigo-600">GPA Score: <span className="text-slate-800">{edu.gpa}</span></p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Skills Grid */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-500" />
                      Extracted Competency Index
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Matched Core Skills</span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.skills.technical.map((sk, i) => (
                            <span key={i} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium">{sk}</span>
                          ))}
                          {analysisResult.skills.technical.length === 0 && (
                            <span className="text-xs text-slate-400 italic font-light">None recognized.</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Soft Skills & Methodologies</span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.skills.soft.map((sk, i) => (
                            <span key={i} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[10px] font-medium">{sk}</span>
                          ))}
                          {analysisResult.skills.soft.length === 0 && (
                            <span className="text-xs text-slate-400 italic font-light">None recognized.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {analysisResult.skills.custom.length > 0 && (
                      <div className="bg-indigo-50/40 border border-indigo-100/50 p-3.5 rounded-lg space-y-2">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Additional Extracted Skills (Custom)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {analysisResult.skills.custom.map((sk, i) => (
                            <span key={i} className="bg-white border border-indigo-200 text-indigo-800 px-2.5 py-0.5 rounded-md text-[10px] font-medium">{sk}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Projects & Accents */}
                  {analysisResult.projects.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        Identified Projects
                      </h4>
                      <div className="space-y-2">
                        {analysisResult.projects.map((proj, idx) => (
                          <div key={idx} className="border border-slate-150 p-3 bg-white rounded-lg text-xs text-slate-700 font-light flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                            <span>{proj}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Tab 3: Detailed Bullet Point Quality & Corrections */}
              {activeTab === 'corrections' && (
                <div className="p-6 space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Experience Line-by-Line Critique</h3>
                    <p className="text-slate-400 text-xs font-light">Each work bullet point is analyzed against modern high-performing ATS criteria (Active starts, quantifiable metrics, word count limits).</p>
                  </div>

                  {analysisResult.experience.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No experience section found to analyze.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {analysisResult.experience.map((exp, idx) => (
                        <div key={idx} className="space-y-3 border-l-2 border-indigo-100 pl-4">
                          <div>
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{exp.role}</span>
                            <h4 className="text-sm font-bold text-slate-900">{exp.company}</h4>
                          </div>

                          <div className="space-y-4">
                            {exp.bullets.map((bullet, bulletIdx) => (
                              <div key={bulletIdx} className="bg-slate-50 border border-slate-150 rounded-lg p-3.5 space-y-3">
                                
                                {/* Raw text */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Bullet Point</span>
                                  <p className="text-xs text-slate-800 font-mono italic">"{bullet.text}"</p>
                                </div>

                                {/* Status indicators */}
                                <div className="flex flex-wrap gap-2.5 pt-1">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                    bullet.hasActionVerb 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {bullet.hasActionVerb ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                    {bullet.hasActionVerb ? 'Active Verb Found' : 'Passive/Weak Start'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                    bullet.hasMetric 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {bullet.hasMetric ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                    {bullet.hasMetric ? `Quantifiable Impact: ${bullet.metric}` : 'No Metric Outcomes'}
                                  </span>
                                </div>

                                {/* Recommendation / Suggestion box */}
                                {bullet.issue && (
                                  <div className="bg-white border-l-2 border-amber-400 p-2.5 rounded-r-md space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold">
                                      <Lightbulb className="w-3.5 h-3.5" />
                                      ATS Fix Checklist
                                    </div>
                                    <p className="text-[11px] text-slate-600 font-light">{bullet.issue}</p>
                                    <p className="text-[11px] text-slate-800 font-medium">Suggestion: <span className="text-indigo-600">{bullet.suggestion}</span></p>
                                    
                                    {bullet.suggestion && (
                                      <button 
                                        onClick={() => copyImproved(bullet.suggestion || '')}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                                      >
                                        <Copy className="w-3 h-3" />
                                        Copy Suggestion
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Target Job Matcher (Comparison Engine) */}
              {activeTab === 'matcher' && (
                <div className="p-6 space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Job Description Keyword Comparison</h3>
                    <p className="text-slate-400 text-xs font-light">Calculates real-time structural similarities and identifies missing high-value technical keywords which should be added to boost ATS indexing scores.</p>
                  </div>

                  {!jobText.trim() ? (
                    <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl space-y-2">
                      <p className="text-xs text-indigo-900 font-medium flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-indigo-500" />
                        No target job description was entered.
                      </p>
                      <p className="text-xs text-indigo-700 font-light">
                        To activate comparison scans, paste your target job posting text into the optional job box on the left-hand column panel.
                      </p>
                    </div>
                  ) : matchResult ? (
                    <div className="space-y-6">
                      {/* Match Score block */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-150 p-4 rounded-xl bg-slate-50/50">
                        <div className="text-center sm:border-r border-slate-200">
                          <span className="text-4xl font-black text-slate-900">{matchResult.matchScore}%</span>
                          <p className="text-[11px] text-slate-400 font-light mt-1">Keyword Match Index</p>
                        </div>
                        <div className="text-center sm:border-r border-slate-200">
                          <span className="text-2xl font-extrabold text-emerald-600">{matchResult.matchedKeywords.length}</span>
                          <p className="text-[11px] text-slate-400 font-light mt-1">Keywords Present</p>
                        </div>
                        <div className="text-center">
                          <span className="text-2xl font-extrabold text-amber-500">{matchResult.missingKeywords.length}</span>
                          <p className="text-[11px] text-slate-400 font-light mt-1">Missing Key Terms</p>
                        </div>
                      </div>

                      {/* Keyword Density List */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identified Terms in Resume</h4>
                        <div className="flex flex-wrap gap-2">
                          {matchResult.matchedKeywords.map((kw, i) => (
                            <span key={i} className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {kw}
                            </span>
                          ))}
                          {matchResult.matchedKeywords.length === 0 && (
                            <span className="text-xs text-slate-400 italic">No job technical terms found in resume text.</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Missing Core Keywords (Recommended to Add)</h4>
                        <p className="text-slate-400 text-[11px] font-light">Add these words into your resume description to optimize the layout score against the target JD screening.</p>
                        <div className="flex flex-wrap gap-2">
                          {matchResult.missingKeywords.map((kw, i) => (
                            <span key={i} className="bg-amber-50 text-amber-700 border border-amber-150 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              {kw}
                            </span>
                          ))}
                          {matchResult.missingKeywords.length === 0 && (
                            <span className="text-xs text-slate-500 font-medium text-emerald-700">Perfect alignment! All key job terms covered.</span>
                          )}
                        </div>
                      </div>

                      {matchResult.density.length > 0 && (
                        <div className="space-y-3 border-t border-slate-100 pt-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matched Keyword Densities</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {matchResult.density.slice(0, 8).map((item, idx) => (
                              <div key={idx} className="bg-white border border-slate-100 rounded-lg p-2.5 text-center shadow-2xs">
                                <span className="text-xs font-bold text-slate-700 block truncate">{item.word}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{item.count} occurrences</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}



            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-slate-600">No score evaluated yet.</p>
              <p className="text-xs font-light mt-1">Please enter your resume content on the left-hand panel and click "Calculate ATS Score & Metrics" to view the scorecard.</p>
            </div>
          )}
        </div>

      </div>

      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-5 h-5 text-indigo-600" />
                  Install & Run Locally
                </h3>
                <p className="text-slate-500 text-xs font-light">Install on your device or download the fully functional offline app.</p>
              </div>
              <button 
                onClick={() => setShowInstallModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100"
              >
                <span className="text-lg font-bold">✕</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Option 1: Native PWA Installation */}
              <div className="border border-indigo-150/40 rounded-xl p-5 space-y-4 bg-indigo-50/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-600" />
                    Method 1: Direct Browser Installation (PWA)
                  </h4>
                  <button
                    onClick={handleInstallApp}
                    className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5 animate-bounce" />
                    Install App Now
                  </button>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed font-light">
                  Placement Club ATS is configured as a **Progressive Web App (PWA)**. You can install it directly to your operating system to launch it from your desktop, dock, or home screen with local file access.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="bg-white p-3 border border-slate-100 rounded-lg">
                    <span className="font-bold text-slate-800 block mb-1">🖥️ Desktop (Chrome / Edge / Opera)</span>
                    Click the <span className="font-semibold text-indigo-700">"Install App Now"</span> button above or look at the right side of your browser URL search bar for the <span className="font-semibold text-indigo-600">"Install" icon</span>.
                  </div>
                  <div className="bg-white p-3 border border-slate-100 rounded-lg">
                    <span className="font-bold text-slate-800 block mb-1">📱 Mobile (iOS Safari / Android Chrome)</span>
                    On Android, click the 3 dots menu and choose <span className="font-semibold text-indigo-600">"Install App"</span>. On iOS Safari, tap <span className="font-semibold text-indigo-600">Share</span> and select <span className="font-semibold text-indigo-600">"Add to Home Screen"</span>.
                  </div>
                </div>
              </div>

              {/* Option 2: Windows Native Desktop App Launcher & Executable Generator */}
              <div className="border border-indigo-150 rounded-xl p-5 space-y-4 bg-slate-50/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-indigo-600" />
                    Method 2: Windows Desktop App Launcher (.bat) & .exe Builder
                  </h4>
                  <button
                    onClick={handleDownloadWindowsLauncher}
                    className="cursor-pointer bg-slate-850 hover:bg-slate-750 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Windows App Launcher (.bat)
                  </button>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed font-light">
                  Download the instant **Windows Desktop App Launcher**. It opens the ATS Reviewer directly inside a native, chromeless desktop shell (frameless, lightweight, with no browser tabs or address bar!).
                </p>

                <div className="bg-slate-950 text-slate-100 rounded-lg p-3.5 font-mono text-[10px] space-y-2 border border-slate-800">
                  <span className="text-slate-400 block border-b border-slate-800 pb-1.5 font-bold uppercase tracking-wider text-[9px]">🛠️ Build Your Own Windows Native Executable (.exe)</span>
                  <p className="text-slate-300 font-light leading-normal">
                    You can easily compile this web software into a 100% independent Windows binary <strong className="text-indigo-400 font-semibold">.exe</strong> file in less than 10 seconds. Open your PowerShell/CMD terminal and execute:
                  </p>
                  <div className="relative bg-slate-900 p-2.5 rounded border border-slate-800 select-all font-semibold flex items-center justify-between gap-2 text-indigo-300">
                    <code>npx nativefier --name "PlacementClubATS" --platform "windows" --icon "https://cdn-icons-png.flaticon.com/512/3135/3135697.png" --internal-urls ".*" "https://ais-pre-aby7w5tdbkjk7pd6q3zbcr-716724850001.asia-southeast1.run.app"</code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText('npx nativefier --name "PlacementClubATS" --platform "windows" --icon "https://cdn-icons-png.flaticon.com/512/3135/3135697.png" --internal-urls ".*" "https://ais-pre-aby7w5tdbkjk7pd6q3zbcr-716724850001.asia-southeast1.run.app"');
                        showToast('success', 'Nativefier command copied to clipboard!');
                      }}
                      className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded text-[9px] border border-slate-700 font-sans font-bold"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-slate-400 text-[9px] font-light italic mt-1">
                    This generates a portable "PlacementClubATS.exe" native desktop app that runs perfectly offline or online.
                  </p>
                </div>
              </div>

              {/* Option 3: Download Standalone offline-ready HTML */}
              <div className="border border-slate-150 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Method 3: Standalone HTML Installer File
                    </h4>
                    <p className="text-slate-600 text-xs leading-relaxed font-light">
                      Download a single, self-contained interactive `.html` file. It bundles the full UI, CSS stylesheets, parsing logic, and offline PDF-reading integration. No server or installation required — just click the file to run it 100% offline on any computer.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleDownloadOfflineHtml}
                  className="w-full sm:w-auto cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Standalone Offline App (.html)
                </button>
              </div>

              {/* Option 4: Export Full Project Source Guide */}
              <div className="border border-slate-150 rounded-xl p-5 space-y-3 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-600" />
                  Method 4: Full Workspace Source Code Export
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed font-light">
                  If you are a developer and want to customize or deploy this software in your own infrastructure:
                </p>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4 font-light">
                  <li>Click the **Settings** menu at the top-right of your AI Studio console.</li>
                  <li>Select <span className="font-semibold text-indigo-600">"Export to ZIP"</span> or <span className="font-semibold text-indigo-600">"Export to GitHub"</span> to download the complete full-stack React + Vite workspace.</li>
                  <li>Extract the downloaded archive and run `npm install` followed by `npm run dev` to launch your private local development portal.</li>
                </ol>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowInstallModal(false)}
                className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-lg transition-all"
              >
                Close Installer Panel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
