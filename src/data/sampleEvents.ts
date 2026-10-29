import { CampusEvent } from '../types/event';

/**
 * SRM TRP Engineering College — Official Institutional Placement & Opportunities Dataset
 * Sourced directly from:
 * 1. BlackStraw & MrCooper Campus Drives
 * 2. Visionet Systems Pvt Ltd Job Specification & 5 LPA FTE Offer
 * 3. Visionet Talent Quest 2026 National Innovation & Hiring Challenge
 */
export const SAMPLE_EVENTS: CampusEvent[] = [
  {
    id: 'srm-trp-visionet-techathon-2026',
    event_id: 'CC-2026-VIS-001',
    name: 'Visionet Talent Quest 2026 – TechaThon & National Hiring Challenge',
    organizer_name: 'Visionet Systems Pvt Ltd & SRM TRP Training Cell',
    organizer_type: 'Company',
    department: 'Engineering & Technology',
    category: 'Hackathons',
    event_type: 'Hiring Hackathon',
    start_date: '2026-10-12T09:00:00Z',
    end_date: '2026-12-05T18:00:00Z',
    registration_deadline: '2026-10-16T23:59:59Z',
    location: 'Bangalore / Hybrid (College Campus & Visionet Tech Centers)',
    mode: 'Hybrid',
    fee_type: 'Free',
    fee_amount: 0,
    registration_fee: 0,
    tags: [
      'Visionet',
      'TechaThon',
      'AI & GenAI',
      'Machine Learning',
      'Cloud & DevOps',
      'Cybersecurity',
      'Software Engineering',
      '5 LPA FTE',
      'Internship',
      'Top 6 Winning Teams'
    ],
    status: 'Published',
    featured: true,
    description:
      'Visionet Talent Quest 2026 – TechaThon is an industry-led national innovation and hiring initiative for engineering students. Students form teams of 3–5 members to develop high-impact technical solutions, present directly to Visionet technology leaders, compete for recognition among the Top 6 Winning Teams, and secure 6-month paid internships followed by 5 LPA full-time employment (FTE).\n\nKey Technology Tracks:\n• AI & Generative AI | Machine Learning | Data & Analytics\n• Cloud & DevOps | Cybersecurity | Software Engineering | Automation\n\nTimeline & Schedule:\n• 12–16 October 2026: College Registration\n• 19–23 October 2026: Idea Submission\n• 2–17 November 2026: Solution Development\n• 1 December 2026: TechaThon Final Evaluation\n• 5 December 2026: Grand Finale & Awards\n\nFor inquiries: techathon.2026@visionet.com',
    eligibility:
      'Pre-final and final year engineering students in AI, CS, IS, ECE, EEE with minimum 70% aggregate (relaxed to 60% in exceptional cases) and no active backlogs.',
    contact_email: 'techathon.2026@visionet.com',
    contact_phone: '+91 80 6690 1000',
    registration_url:
      'https://forms.cloud.microsoft/pages/responsepage.aspx?id=No9mddNlkE2pkEu47BZyjwuxvuNjuSxDqFVJCfUKW5RUQTZWWVZDSTZRQkRFR0Q4VDBHUFgzRVhFViQlQCNjPTEu&route=shorturl',
    banner_url:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    max_participants: 500,
    source_row_id: 2,
    prizes_summary: 'Top 6 Winning Teams Awards + 6-Month Paid Internships (10k/mo) + 5 LPA FTE Offers',
    created_at: '2026-10-12T08:00:00Z',
    updated_at: '2026-10-29T10:00:00Z',
  },
  {
    id: 'srm-trp-visionet-internship',
    event_id: 'CC-2026-VIS-002',
    name: 'Visionet Systems: 6-Month Paid AI & Cloud Internship (5 LPA PPO)',
    organizer_name: 'Visionet Systems Pvt Ltd',
    organizer_type: 'Company',
    department: 'Department of Training & Placement',
    category: 'Internships',
    event_type: 'Paid Internship',
    start_date: '2026-12-01T09:00:00Z',
    end_date: '2027-06-30T18:00:00Z',
    registration_deadline: '2026-10-16T23:59:59Z',
    location: 'Bangalore / Coimbatore / Hyderabad / Remote',
    mode: 'Hybrid',
    fee_type: 'Free',
    fee_amount: 0,
    registration_fee: 0,
    tags: [
      'Visionet',
      'Paid Internship',
      '5 LPA CTC',
      'AI & Cloud',
      'Salesforce',
      'ServiceNow',
      'Full Stack',
      'Data Engineering'
    ],
    status: 'Published',
    featured: true,
    description:
      'Official campus recruitment program offering a 6-month paid internship followed by performance-based full-time placement at Visionet Systems Pvt Ltd (CIN: U72200KA2006PTC039537, Great Place to Work Certified, Glassdoor 4.0).\n\nKey Details:\n• Role: Engineering Intern followed by Associate Software Engineer (FTE)\n• Internship Stipend: ₹10,000/month (+ ₹1,500/month under Government of India NAPS)\n• Proposed CTC: ₹5,00,000 per annum (5 LPA)\n• Technologies: AI, Cloud Technologies, Salesforce & Digital Commerce, ESM & ServiceNow, Full Stack Development, QA Services, Data Engineering, Integration Frameworks\n• Drive Mode: TechaThon, Assessment, and Technical Interview.',
    eligibility:
      'BE / B.Tech (Engg Branches: AI, CS, IS, ECE, EEE) students. Minimum 70% aggregate in Engineering with no active backlogs.',
    contact_email: 'techathon.2026@visionet.com',
    contact_phone: '+91 80 6690 1000',
    registration_url:
      'https://forms.cloud.microsoft/pages/responsepage.aspx?id=No9mddNlkE2pkEu47BZyjwuxvuNjuSxDqFVJCfUKW5RUQTZWWVZDSTZRQkRFR0Q4VDBHUFgzRVhFViQlQCNjPTEu&route=shorturl',
    banner_url:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    source_row_id: 3,
    prizes_summary: '₹10,000/month stipend (+ ₹1,500 NAPS) during internship + ₹5,00,000 PA FTE',
    created_at: '2026-10-12T08:00:00Z',
    updated_at: '2026-10-29T10:00:00Z',
  },
  {
    id: 'srm-trp-blackstraw-drive',
    event_id: 'CC-2026-BST-001',
    name: 'BlackStraw: AI & Product Engineering Campus Recruitment Drive',
    organizer_name: 'Department of Training & Placement, SRM TRP Engineering College & BlackStraw',
    organizer_type: 'Company',
    department: 'Department of Training & Placement',
    category: 'Career Opportunities',
    event_type: 'Campus Recruitment Drive',
    start_date: '2026-10-20T09:00:00Z',
    end_date: '2026-11-15T18:00:00Z',
    registration_deadline: '2026-10-25T23:59:59Z',
    location: 'SRM TRP Campus, Trichy / BlackStraw Chennai Tech Center',
    mode: 'Hybrid',
    fee_type: 'Free',
    fee_amount: 0,
    registration_fee: 0,
    tags: [
      'BlackStraw',
      'AI Product Engineering',
      'LLM Applications',
      'Interview Feedback',
      'Campus Drive'
    ],
    status: 'Published',
    featured: true,
    description:
      'Exclusive campus recruitment drive conducted by BlackStraw for engineering students of SRM TRP Engineering College. Focuses on full-stack AI engineering, computer vision, natural language understanding, and cloud ML deployments.\n\nAll participating candidates can access their evaluation and interview debrief through the official institutional interview feedback spreadsheet.',
    eligibility:
      'Engineering students with strong foundation in Python, PyTorch/TensorFlow, and data structures. Zero active backlogs.',
    contact_email: 'placement@trp.srmtrichy.edu.in',
    contact_phone: '+91 97897 96491',
    registration_url:
      'https://docs.google.com/spreadsheets/d/1GDZrZAl3lFWGXbH8ryOeT1Ql53xsuF9YCMCin9Z067M/edit?resourcekey=&gid=700736968#gid=700736968',
    banner_url:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    source_row_id: 4,
    prizes_summary: 'Full-Time AI Engineering Roles & Paid Summer Internships',
    created_at: '2026-10-10T08:00:00Z',
    updated_at: '2026-10-29T10:00:00Z',
  },
  {
    id: 'srm-trp-mrcooper-drive',
    event_id: 'CC-2026-MRC-001',
    name: 'MrCooper: Fintech Software Engineering & Cloud Systems Hiring Drive',
    organizer_name: 'Department of Training & Placement, SRM TRP Engineering College & MrCooper',
    organizer_type: 'Company',
    department: 'Department of Training & Placement',
    category: 'Career Opportunities',
    event_type: 'Campus Recruitment Drive',
    start_date: '2026-10-22T09:00:00Z',
    end_date: '2026-11-18T18:00:00Z',
    registration_deadline: '2026-10-26T23:59:59Z',
    location: 'SRM TRP Auditorium, Trichy & MrCooper Center of Excellence',
    mode: 'Hybrid',
    fee_type: 'Free',
    fee_amount: 0,
    registration_fee: 0,
    tags: [
      'MrCooper',
      'Fintech',
      'Software Engineering',
      'Cloud Architecture',
      'Interview Feedback'
    ],
    status: 'Published',
    featured: true,
    description:
      'MrCooper Group campus placement drive for SRM TRP engineering students. Selected candidates contribute to mission-critical fintech mortgage ecosystems, cloud microservices, and AI-enabled financial workflows.\n\nStudents who completed assessments can review their stage results via the official student interview feedback tracker.',
    eligibility:
      'Engineering candidates. Minimum CGPA of 7.0 and high problem-solving aptitude.',
    contact_email: 'placement@trp.srmtrichy.edu.in',
    contact_phone: '+91 97897 96491',
    registration_url:
      'https://docs.google.com/spreadsheets/d/1AxJv8rb9PRxejvGASoUZNPCpLIbyBQ9XnDEB_cMp3hE/edit?resourcekey=&gid=1104427619#gid=1104427619',
    banner_url:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    source_row_id: 5,
    prizes_summary: 'Fintech Software Engineer FTE Packages & 6-Month Internships',
    created_at: '2026-10-10T08:00:00Z',
    updated_at: '2026-10-29T10:00:00Z',
  }
];
