import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Configure body-parser to support base64 uploads for resumes
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Initialize Gemini SDK with User-Agent for tracking
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const ai = getGenAIClient();

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Placement Club ATS API running smoothly" });
});

// Resume analysis API using Gemini 3.5-flash and JSON responseSchema
app.post("/api/parse-resume", async (req, res) => {
  try {
    const { fileBase64, mimeType, resumeText, jobs = [] } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please add it in the Secrets panel."
      });
    }

    if (!fileBase64 && !resumeText) {
      return res.status(400).json({ error: "Missing resume source: provide fileBase64 or resumeText" });
    }

    const jobsString = JSON.stringify(jobs);
    let promptContent: any;

    if (fileBase64) {
      promptContent = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "application/pdf",
              data: fileBase64
            }
          },
          {
            text: `You are an expert technical ATS (Applicant Tracking System) recruiter and resume analyst.
Analyze the attached resume file and extract all information into the requested JSON schema.
Ensure to accurately parse the candidate's name, email, phone, education details, and translate GPA to a 10-point scale if it is on a different scale (e.g. 4.0 or percentage).
Extract skills, experiences, and projects in detail.

Additionally, we have active placement job openings. Here is the list of current jobs:
${jobsString}

For each of these jobs, calculate a custom suitability Match Score (from 0 to 100) based on how well this candidate's skills, experience, and projects align with the job description and eligibility criteria. Populate the matchScores array accordingly.
Also provide high-quality AI feedback: 3 core strengths, 2-3 weaknesses (skill gaps), 3 highly actionable resume improvement suggestions, and recommended career roles.`
          }
        ]
      };
    } else {
      promptContent = `You are an expert technical ATS (Applicant Tracking System) recruiter and resume analyst.
Analyze the following resume text and extract all information into the requested JSON schema.
Ensure to accurately parse the candidate's name, email, phone, education details, and translate GPA to a 10-point scale if it is on a different scale (e.g. 4.0 or percentage).
Extract skills, experiences, and projects in detail.

Resume Text:
"""
${resumeText}
"""

Additionally, we have active placement job openings. Here is the list of current jobs:
${jobsString}

For each of these jobs, calculate a custom suitability Match Score (from 0 to 100) based on how well this candidate's skills, experience, and projects align with the job description and eligibility criteria. Populate the matchScores array accordingly.
Also provide high-quality AI feedback: 3 core strengths, 2-3 weaknesses (skill gaps), 3 highly actionable resume improvement suggestions, and recommended career roles.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptContent,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Candidate's full name. Match standard resume header." },
            email: { type: Type.STRING, description: "Candidate's email address. Must be a valid email string if found." },
            phone: { type: Type.STRING, description: "Candidate's contact phone number." },
            college: { type: Type.STRING, description: "Current/last college or university name." },
            degree: { type: Type.STRING, description: "Degree abbreviation, e.g., B.Tech, M.Tech, BS, MS, BCA, MCA, MBA." },
            branch: { type: Type.STRING, description: "Specialization branch or major, e.g., Computer Science, Electrical Engineering, Finance." },
            graduationYear: { type: Type.STRING, description: "Year of graduation (or expected), e.g., 2027." },
            gpa: { type: Type.NUMBER, description: "Extracted CGPA or percentage mapped to a 10-point CGPA scale (e.g. 8.5). If not found, return 8.0." },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Extracted technical and professional skills, e.g., ['React', 'Python']."
            },
            experience: {
              type: Type.ARRAY,
              description: "Candidate work experience, internships, or leadership positions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING, description: "Job title or role" },
                  company: { type: Type.STRING, description: "Company or organization name" },
                  duration: { type: Type.STRING, description: "Duration or dates, e.g., June 2025 - Aug 2025" },
                  description: { type: Type.STRING, description: "Bullet points or brief description of tasks and achievements" }
                },
                required: ["role", "company", "duration", "description"]
              }
            },
            projects: {
              type: Type.ARRAY,
              description: "Academic or personal software/engineering projects.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Project title" },
                  technologies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Technologies utilized, e.g., ['React', 'Node.js']"
                  },
                  description: { type: Type.STRING, description: "Summary of what was built and the impact" }
                },
                required: ["title", "technologies", "description"]
              }
            },
            feedback: {
              type: Type.OBJECT,
              description: "Detailed evaluation of the resume with actionable constructive advice.",
              properties: {
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Exactly three solid strengths of this candidate's profile."
                },
                weaknesses: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "2-3 notable skill gaps or weaknesses relative to standard placement requirements."
                },
                improvementSuggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "3 highly specific, technical, and actionable recommendations to upgrade their resume."
                },
                recommendedRoles: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "2-3 targeted roles suitable for this candidate."
                }
              },
              required: ["strengths", "weaknesses", "improvementSuggestions", "recommendedRoles"]
            },
            matchScores: {
              type: Type.ARRAY,
              description: "Calculated match scores for each of the provided job listings.",
              items: {
                type: Type.OBJECT,
                properties: {
                  jobId: { type: Type.STRING, description: "The unique job ID." },
                  score: { type: Type.NUMBER, description: "Suited score from 0 to 100 based on skill fit, academic standings, and experiences." }
                },
                required: ["jobId", "score"]
              }
            }
          },
          required: [
            "name", "email", "phone", "college", "degree", "branch", "graduationYear",
            "gpa", "skills", "experience", "projects", "feedback", "matchScores"
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini model.");
    }

    const parsedData = JSON.parse(resultText.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/parse-resume:", error);
    res.status(500).json({ error: error.message || "Failed to analyze resume with Gemini AI" });
  }
});

// AI Interview Prep Endpoint
app.post("/api/generate-interview-prep", async (req, res) => {
  try {
    const { candidate, job } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please add it in the Secrets panel."
      });
    }

    if (!candidate || !job) {
      return res.status(400).json({ error: "Missing required fields: provide both candidate and job" });
    }

    const prompt = `You are an elite Placement Director and technical mock interviewer.
Create custom interview preparation materials for student "${candidate.name}" who is tracking for the role of "${job.role}" at "${job.company}".

Candidate Details:
- Branch: ${candidate.branch} (${candidate.degree})
- GPA: ${candidate.gpa}/10
- Skills: ${JSON.stringify(candidate.skills)}
- Work Experience: ${JSON.stringify(candidate.experience)}
- Core Projects: ${JSON.stringify(candidate.projects)}

Target Job Profile:
- Role: ${job.role}
- Company: ${job.company}
- Job Description: ${job.description}
- Required Skills: ${JSON.stringify(job.skillsRequired)}

Generate exactly 4-5 tailored mock interview questions. The list must contain:
1. One resume-specific project question probing deeper details on a project mentioned by the student.
2. One technical core question directly testing their proficiency in the required tech stack of the job.
3. One behavioral/situational question assessing soft-skills fit for the role.
4. One problem-solving or case-style question assessing algorithmic or logical reasoning.

For each question, provide:
- The type (Technical, Behavioral, Resume-Specific, etc.)
- Context (why this specific question is highly relevant based on their resume vs the job requirements)
- A stellar suggested answer showing the candidate how to structure their response (e.g., using STAR method for behavioral, or structured logic for technical)
- Evaluation tips for the college placement officer on what key aspects to grade.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "A list of custom interview questions",
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The tailored interview question." },
              type: { type: Type.STRING, description: "Question category: Technical, Behavioral, Resume-Specific, Problem-solving." },
              context: { type: Type.STRING, description: "Rationale for asking this candidate." },
              suggestedAnswer: { type: Type.STRING, description: "An exemplar mock answer written from the student's perspective." },
              evaluationTips: { type: Type.STRING, description: "Tips on what a placement officer should look/listen for." }
            },
            required: ["question", "type", "context", "suggestedAnswer", "evaluationTips"]
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini.");
    }

    const prepData = JSON.parse(resultText.trim());
    res.json(prepData);
  } catch (error: any) {
    console.error("Error in /api/generate-interview-prep:", error);
    res.status(500).json({ error: error.message || "Failed to generate interview prep with Gemini AI" });
  }
});

async function bootstrap() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} under environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap().catch(err => {
  console.error("Server startup failure:", err);
});
