import { Candidate, Job, AdminFaculty, StudentReview } from '../types';

export const sampleJobs: Job[] = [
  {
    id: 'job-1',
    company: 'Google',
    role: 'Software Engineer (Intern)',
    description: 'Join Google as a Software Engineer Intern to work on next-generation consumer applications and infrastructure. Looking for candidates strong in data structures, algorithms, and system concepts.',
    skillsRequired: ['TypeScript', 'Python', 'C++', 'Data Structures', 'Algorithms', 'System Design'],
    minGpa: 8.5,
    location: 'Bangalore, India',
    salary: '₹1,25,000 / month',
    eligibility: 'B.Tech / M.Tech in CS, IT, or related fields. Graduation year 2027.',
    status: 'active',
    createdDate: '2026-06-10'
  },
  {
    id: 'job-2',
    company: 'Stripe',
    role: 'Solutions Engineer',
    description: 'Help Stripe’s largest customers design and deploy complex financial technology integrations. Requires high technical acumen paired with stellar client-facing communication skills.',
    skillsRequired: ['JavaScript', 'Node.js', 'APIs', 'SQL', 'Technical Writing', 'Public Speaking'],
    minGpa: 7.5,
    location: 'Singapore (Remote Friendly)',
    salary: 'SGD 6,000 / month',
    eligibility: 'All Engineering/Science majors. High interpersonal skills are a must.',
    status: 'active',
    createdDate: '2026-06-25'
  },
  {
    id: 'job-3',
    company: 'Vercel',
    role: 'Frontend Developer Intern',
    description: 'Work with the team building Next.js and Vercel hosting platforms. High proficiency in React, performance optimization, and elegant UI implementation using Tailwind CSS.',
    skillsRequired: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'CSS', 'Vite', 'Git'],
    minGpa: 8.0,
    location: 'Mumbai, India (Hybrid)',
    salary: '₹80,000 / month',
    eligibility: 'Open to all students with exceptional frontend portfolios.',
    status: 'active',
    createdDate: '2026-07-01'
  },
  {
    id: 'job-4',
    company: 'McKinsey & Company',
    role: 'Junior Business Analyst',
    description: 'Provide quantitative analysis, financial modeling, and strategy consulting to world-class enterprise clients. Strong logical deduction and analytical writing required.',
    skillsRequired: ['Python', 'SQL', 'Excel', 'Financial Modeling', 'Data Analysis', 'Problem Solving'],
    minGpa: 8.0,
    location: 'Delhi NCR, India',
    salary: '₹18,00,000 / annum',
    eligibility: 'Open to all Engineering, Economics, and Management degrees.',
    status: 'active',
    createdDate: '2026-07-05'
  },
  {
    id: 'job-5',
    company: 'TCS',
    role: 'Graduate Engineer Trainee',
    description: 'Kickstart your IT career at one of the largest multinational consulting organizations. Gain comprehensive bootcamps in cloud, database management, and full-stack architecture.',
    skillsRequired: ['Java', 'SQL', 'HTML', 'JavaScript', 'Core Java', 'SDLC'],
    minGpa: 6.0,
    location: 'Hyderabad, India',
    salary: '₹4,50,000 / annum',
    eligibility: 'All B.Tech / MCA majors with clear standing and no active backlogs.',
    status: 'active',
    createdDate: '2026-07-10'
  }
];

export const sampleCandidates: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Amit Sharma',
    email: 'amit.sharma.cs23@college.edu',
    phone: '+91 98765 43210',
    college: 'State Institute of Technology',
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering',
    graduationYear: '2027',
    gpa: 9.2,
    skills: ['TypeScript', 'React', 'Node.js', 'Python', 'C++', 'Data Structures', 'SQL', 'System Design'],
    experience: [
      {
        role: 'Full-stack Developer Intern',
        company: 'InnovateTech Labs',
        duration: 'June 2025 - August 2025',
        description: 'Designed and deployed a responsive CRM portal. Improved API latency by 35% using Redis caching and consolidated Express routers. Maintained TypeScript type safety.'
      }
    ],
    projects: [
      {
        title: 'Distributed Queue Server',
        technologies: ['C++', 'Sockets', 'Multithreading'],
        description: 'Built a lightweight persistent messaging queue in C++ utilizing thread pooling and POSIX sockets. Features high concurrency handling up to 5,000 concurrent clients.'
      },
      {
        title: 'College Placement Tracker',
        technologies: ['React', 'Tailwind CSS', 'Node.js', 'SQL'],
        description: 'Created an internal portal for students to apply to college recruiters, upload resumes, and track their interview stages in real-time.'
      }
    ],
    status: 'placed',
    appliedDate: '2026-06-12',
    lastUpdated: '2026-07-10',
    notes: 'Exceptional technical depth. Amit performed perfectly in Google interviews. Received and accepted software engineering intern offer.',
    feedback: {
      strengths: [
        'Robust computer science fundamentals (C++, multithreading, advanced data structures).',
        'Demonstrates practical enterprise internship experience optimizing production databases.',
        'High GPA reflects strong academic rigor and self-discipline.'
      ],
      weaknesses: [
        'Relatively less exposure to major cloud providers like AWS or GCP in core projects.',
        'Public portfolios focus heavily on backend, with fewer visual designs.'
      ],
      improvementSuggestions: [
        'Integrate standard cloud deployment (AWS ECS, Docker) into existing project documentation.',
        'Host project live demos and link them in the header for easier verification.'
      ],
      recommendedRoles: ['Backend Software Engineer', 'Systems Programmer', 'Distributed Systems Intern']
    },
    matchScores: {
      'job-1': 94,
      'job-2': 82,
      'job-3': 88,
      'job-4': 78,
      'job-5': 98
    }
  },
  {
    id: 'cand-2',
    name: 'Priya Patel',
    email: 'priya.patel.ds23@college.edu',
    phone: '+91 87654 32109',
    college: 'State Institute of Technology',
    degree: 'B.Tech',
    branch: 'Data Science & Artificial Intelligence',
    graduationYear: '2027',
    gpa: 8.7,
    skills: ['Python', 'SQL', 'Pandas', 'NumPy', 'Scikit-Learn', 'Data Visualization', 'Tableau', 'Excel'],
    experience: [
      {
        role: 'Data Analyst Trainee',
        company: 'Nippon Finance Group',
        duration: 'Dec 2025 - Jan 2026',
        description: 'Constructed custom Tableau dashboards tracking corporate mortgage defaults. Automated monthly financial reporting using Python pandas, saving 15 manual hours per month.'
      }
    ],
    projects: [
      {
        title: 'Campus Food Wastage Optimizer',
        technologies: ['Python', 'Linear Programming', 'Excel'],
        description: 'Utilized optimization models to estimate daily cafeteria prep sizes based on historic student entry schedules, reducing raw ingredient wastage by 18%.'
      },
      {
        title: 'Customer Churn Predictor',
        technologies: ['Scikit-Learn', 'Pandas', 'Flask'],
        description: 'Developed and deployed an ML classifier predicting cellular subscriber churn. Attained 89% precision and wrapped model inside a web service.'
      }
    ],
    status: 'hr',
    appliedDate: '2026-06-26',
    lastUpdated: '2026-07-14',
    notes: 'Passed the McKinsey numerical exam and Case Study rounds perfectly. Now in the final round of HR interviews with leadership.',
    feedback: {
      strengths: [
        'Outstanding analytical mindset with practical data wrangling (Pandas, Excel, SQL) skills.',
        'Completed real-world optimization projects affecting college campus overheads.',
        'Very high business literacy and quantitative intuition.'
      ],
      weaknesses: [
        'Limited experience in traditional software development stacks (JavaScript, full-stack frameworks).',
        'Has not demonstrated web engineering or API deployment basics.'
      ],
      improvementSuggestions: [
        'Complement data skills with basic full-stack integrations (e.g. FastAPI, Node endpoints).',
        'Focus case preparation on market entry strategies and supply chain economics.'
      ],
      recommendedRoles: ['Business Analyst', 'Data Analyst', 'Data Solutions Engineer']
    },
    matchScores: {
      'job-1': 60,
      'job-2': 85,
      'job-3': 50,
      'job-4': 92,
      'job-5': 80
    }
  },
  {
    id: 'cand-3',
    name: 'Rohit Verma',
    email: 'rohit.verma.it23@college.edu',
    phone: '+91 76543 21098',
    college: 'State Institute of Technology',
    degree: 'B.Tech',
    branch: 'Information Technology',
    graduationYear: '2027',
    gpa: 8.1,
    skills: ['JavaScript', 'React', 'Next.js', 'Tailwind CSS', 'Vite', 'HTML', 'CSS', 'Node.js', 'Git'],
    experience: [
      {
        role: 'Frontend Developer Freelancer',
        company: 'Self-employed',
        duration: 'Jan 2025 - Present',
        description: 'Crafted customized Landing pages and portfolio sites for local retail stores. Styled using CSS transitions, custom fonts, and fully responsive media queries.'
      }
    ],
    projects: [
      {
        title: 'Interactive Design Studio Canvas',
        technologies: ['React', 'Canvas API', 'Tailwind CSS'],
        description: 'Programmed an element canvas enabling users to drag, resize, rotate, and color geometric shapes. Utilized custom hook event handlers.'
      }
    ],
    status: 'technical',
    appliedDate: '2026-07-02',
    lastUpdated: '2026-07-12',
    notes: 'Applied for Vercel Frontend Intern. Cleared screening. Completed initial take-home coding assignment. Code is highly modular and performant. Technical assessment scheduled.',
    feedback: {
      strengths: [
        'Deep fluency in user interface implementation (Tailwind CSS, React custom hooks).',
        'Direct freelancing experience delivering real client applications with visual layouts.'
      ],
      weaknesses: [
        'Relatively lower GPA (8.1) than standard high-tier software engineer cutoffs.',
        'Fewer complex backend or data structure heavy projects.'
      ],
      improvementSuggestions: [
        'Build and demonstrate complex state workflows (e.g., local database caching, WebSockets).',
        'Practice data structures and LeetCode problems to pass automated screening tests.'
      ],
      recommendedRoles: ['Frontend Engineer', 'UI/UX Developer', 'React Developer']
    },
    matchScores: {
      'job-1': 70,
      'job-2': 78,
      'job-3': 95,
      'job-4': 55,
      'job-5': 85
    }
  },
  {
    id: 'cand-4',
    name: 'Sneha Reddy',
    email: 'sneha.reddy.cs23@college.edu',
    phone: '+91 65432 10987',
    college: 'State Institute of Technology',
    degree: 'B.Tech',
    branch: 'Computer Science & Engineering',
    graduationYear: '2027',
    gpa: 8.9,
    skills: ['TypeScript', 'Node.js', 'Express', 'AWS', 'Docker', 'PostgreSQL', 'Python', 'Redis', 'CI/CD'],
    experience: [
      {
        role: 'DevOps Intern',
        company: 'CloudSphere Solutions',
        duration: 'June 2025 - Aug 2025',
        description: 'Set up GitHub Actions pipelines for automated testing and deployment. Managed AWS ECS clusters and wrote Terraform configurations for staging environments.'
      }
    ],
    projects: [
      {
        title: 'High-Throughput Analytics API',
        technologies: ['TypeScript', 'Express', 'PostgreSQL', 'Redis'],
        description: 'Architected a scalable tracking API capable of parsing 1,000 requests/sec. Integrated Redis rate limiters and database connection pooling.'
      }
    ],
    status: 'offered',
    appliedDate: '2026-06-28',
    lastUpdated: '2026-07-15',
    notes: 'Offered Solutions Engineer intern position at Stripe! Excellent feedback from the Stripe technical review panel. Offered on 15 July 2026.',
    feedback: {
      strengths: [
        'Highly practical backend and infrastructure experience (AWS, Docker, CI/CD).',
        'Clean coding style with rigorous unit tests and modular designs.',
        'Strong communication skills evident from client demos during internship.'
      ],
      weaknesses: [
        'Minimal engagement with modern client-side frontend libraries like Next.js.'
      ],
      improvementSuggestions: [
        'Build a single-page visualization application using React and D3 to demonstrate frontend integration.'
      ],
      recommendedRoles: ['DevOps Engineer', 'Backend Engineer', 'Solutions Architect']
    },
    matchScores: {
      'job-1': 88,
      'job-2': 94,
      'job-3': 75,
      'job-4': 80,
      'job-5': 92
    }
  }
];

export const sampleAdmins: AdminFaculty[] = [
  {
    id: 'admin-1',
    name: 'Dr. Rajesh K. Sundaram',
    email: 'rajesh.sundaram@college.edu',
    phone: '+91 98111 22334',
    department: 'Training & Placement Office',
    role: 'Training & Placement Officer',
    assignedBranch: 'All Engineering Branches',
    status: 'active',
    joinedDate: '2021-08-15',
    notes: 'Head TPO in charge of Google, Stripe, and Vercel recruitment drives.'
  },
  {
    id: 'admin-2',
    name: 'Prof. Ananya Sen',
    email: 'ananya.sen.cs@college.edu',
    phone: '+91 98222 33445',
    department: 'Computer Science & Engineering',
    role: 'Department HOD',
    assignedBranch: 'Computer Science & IT',
    status: 'active',
    joinedDate: '2019-06-10',
    notes: 'Coordinates curriculum alignment and student project approvals for CS branch.'
  },
  {
    id: 'admin-3',
    name: 'Dr. Vikram Malhotra',
    email: 'vikram.m.ai@college.edu',
    phone: '+91 98333 44556',
    department: 'Data Science & AI',
    role: 'Placement Coordinator',
    assignedBranch: 'Data Science & Artificial Intelligence',
    status: 'active',
    joinedDate: '2023-01-20',
    notes: 'Specializes in McKinsey, consulting, and AI startup industry connections.'
  }
];

export const sampleReviews: StudentReview[] = [
  {
    id: 'rev-1',
    candidateId: 'cand-1',
    candidateName: 'Amit Sharma',
    reviewedByAdminName: 'Dr. Rajesh K. Sundaram',
    reviewedByAdminEmail: 'rajesh.sundaram@college.edu',
    verificationStatus: 'Approved for Placement',
    feedbackNotes: 'Resume verified. High GPA and Google intern offer confirmed. High priority candidate.',
    dateReviewed: '2026-07-11'
  },
  {
    id: 'rev-2',
    candidateId: 'cand-2',
    candidateName: 'Priya Patel',
    reviewedByAdminName: 'Dr. Vikram Malhotra',
    reviewedByAdminEmail: 'vikram.m.ai@college.edu',
    verificationStatus: 'Approved for Placement',
    feedbackNotes: 'McKinsey & Co candidate. Case study evaluation score 9.5/10. Recommended for financial consulting roles.',
    dateReviewed: '2026-07-14'
  }
];

