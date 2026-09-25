import { Subject, Chapter, PDFDocument, RoutineSlot, Achievement, ShopItem, UserProfile } from '../types';

export function makeSamplePdfBlob(title: string, subject: string, extraNote: string = ''): Blob {
  const cleanTitle = title.replace(/[()]/g, '');
  const cleanSubject = subject.replace(/[()]/g, '');
  const cleanNote = extraNote.replace(/[()]/g, '');
  
  const streamText = `BT
/F1 20 Tf
50 720 Td
(${cleanTitle}) Tj
/F1 13 Tf
0 -35 Td
(CBSE Class 10 Study Material - ${cleanSubject}) Tj
0 -25 Td
(BoardQuest 2027 Quest Archive) Tj
/F1 11 Tf
0 -35 Td
(${cleanNote || 'Official High-Yield Quick Revision Notes and Formulae.'}) Tj
0 -25 Td
(Key Concepts: Definitions, Core Theorems, Diagrams, and NCERT Exemplars.) Tj
0 -25 Td
(Exam Tip: Practice answering 3-mark and 5-mark structured questions step-by-step.) Tj
0 -35 Td
(Status: Offline-ready document stored directly in local IndexedDB.) Tj
ET`;

  const streamLength = streamText.length;

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamText}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000227 00000 n 
0000000450 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
520
%%EOF`;

  return new Blob([pdfString], { type: 'application/pdf' });
}

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'kannada',
    name: 'Kannada',
    code: 'KAN',
    emoji: '📜',
    color: '#eab308', // Yellow / Amber
    badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
    weeklyTargetHours: 4,
    order: 1,
  },
  {
    id: 'math',
    name: 'Mathematics',
    code: 'MATH',
    emoji: '📐',
    color: '#06b6d4', // Cyan
    badgeColor: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
    weeklyTargetHours: 8,
    order: 2,
  },
  {
    id: 'science',
    name: 'Science',
    code: 'SCI',
    emoji: '⚡',
    color: '#10b981', // Emerald
    badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    weeklyTargetHours: 7,
    order: 3,
  },
  {
    id: 'english',
    name: 'English',
    code: 'ENG',
    emoji: '🖋️',
    color: '#a855f7', // Purple
    badgeColor: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
    weeklyTargetHours: 4,
    order: 4,
  },
  {
    id: 'it',
    name: 'IT (402)',
    code: 'IT',
    emoji: '💻',
    color: '#f43f5e', // Rose
    badgeColor: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
    weeklyTargetHours: 3,
    order: 5,
  },
  {
    id: 'ss',
    name: 'Social Science',
    code: 'SS',
    emoji: '🌍',
    color: '#f97316', // Orange
    badgeColor: 'text-orange-400 bg-orange-950/40 border-orange-500/30',
    weeklyTargetHours: 6,
    order: 6,
  },
];

export const INITIAL_CHAPTERS: Chapter[] = [
  // KANNADA
  { id: 'kan-1', subjectId: 'kannada', chapterNo: 1, title: 'ಯುದ್ಧ (Yuddha)', status: 'NOT_STARTED', weakTag: false, notesCount: 1, questionsCount: 0 },
  { id: 'kan-2', subjectId: 'kannada', chapterNo: 2, title: 'ಶಬರಿ (Shabari)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'kan-3', subjectId: 'kannada', chapterNo: 3, title: 'ಭಾಗ್ಯಶಿಲ್ಪಿಗಳು (Bhagyashilpigalu)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'kan-4', subjectId: 'kannada', chapterNo: 4, title: 'ಲಂಡನ್ ನಗರ (London Nagara)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'kan-5', subjectId: 'kannada', chapterNo: 5, title: 'ಸಂಕಲ್ಪ ಗೀತೆ (Sankalpa Geethe)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'kan-6', subjectId: 'kannada', chapterNo: 6, title: 'ಹಲಗಲಿ ಬೇಡರು (Halagali Bedaru)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },

  // MATHEMATICS
  { id: 'math-1', subjectId: 'math', chapterNo: 1, title: 'Real Numbers', status: 'NOT_STARTED', weakTag: false, notesCount: 1, questionsCount: 0 },
  { id: 'math-2', subjectId: 'math', chapterNo: 2, title: 'Polynomials', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-3', subjectId: 'math', chapterNo: 3, title: 'Pair of Linear Equations', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-4', subjectId: 'math', chapterNo: 4, title: 'Quadratic Equations', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-5', subjectId: 'math', chapterNo: 5, title: 'Arithmetic Progressions', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-6', subjectId: 'math', chapterNo: 6, title: 'Triangles (Similarity & Theorems)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-7', subjectId: 'math', chapterNo: 7, title: 'Coordinate Geometry', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-8', subjectId: 'math', chapterNo: 8, title: 'Introduction to Trigonometry', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-9', subjectId: 'math', chapterNo: 9, title: 'Applications of Trigonometry', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-10', subjectId: 'math', chapterNo: 10, title: 'Circles & Tangents', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-11', subjectId: 'math', chapterNo: 11, title: 'Surface Areas and Volumes', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-12', subjectId: 'math', chapterNo: 12, title: 'Statistics (Mean, Median, Mode)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'math-13', subjectId: 'math', chapterNo: 13, title: 'Probability', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },

  // SCIENCE
  { id: 'sci-1', subjectId: 'science', chapterNo: 1, title: 'Chemical Reactions & Equations', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'sci-2', subjectId: 'science', chapterNo: 2, title: 'Acids, Bases and Salts', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'sci-3', subjectId: 'science', chapterNo: 3, title: 'Metals and Non-metals', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'sci-4', subjectId: 'science', chapterNo: 4, title: 'Carbon and its Compounds', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 1 },
  { id: 'sci-5', subjectId: 'science', chapterNo: 5, title: 'Life Processes (Nutrition & Respiration)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'sci-6', subjectId: 'science', chapterNo: 6, title: 'Control and Coordination', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'sci-7', subjectId: 'science', chapterNo: 7, title: 'How do Organisms Reproduce?', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'sci-8', subjectId: 'science', chapterNo: 8, title: 'Heredity and Evolution', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'sci-9', subjectId: 'science', chapterNo: 9, title: 'Light - Reflection and Refraction', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'sci-10', subjectId: 'science', chapterNo: 10, title: 'The Human Eye & Colourful World', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'sci-11', subjectId: 'science', chapterNo: 11, title: 'Electricity (Ohm Law, Circuits)', status: 'NOT_STARTED', weakTag: false, notesCount: 1, questionsCount: 0 },
  { id: 'sci-12', subjectId: 'science', chapterNo: 12, title: 'Magnetic Effects of Electric Current', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'sci-13', subjectId: 'science', chapterNo: 13, title: 'Our Environment & Ecosystem', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },

  // ENGLISH
  { id: 'eng-1', subjectId: 'english', chapterNo: 1, title: 'A Letter to God', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'eng-2', subjectId: 'english', chapterNo: 2, title: 'Nelson Mandela: Long Walk to Freedom', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'eng-3', subjectId: 'english', chapterNo: 3, title: 'Two Stories about Flying', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'eng-4', subjectId: 'english', chapterNo: 4, title: 'From the Diary of Anne Frank', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'eng-5', subjectId: 'english', chapterNo: 5, title: 'Glimpses of India', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'eng-6', subjectId: 'english', chapterNo: 6, title: 'Madam Rides the Bus', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'eng-7', subjectId: 'english', chapterNo: 7, title: 'Poetry: Dust of Snow, Fire & Ice, Amanda', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },

  // IT (402)
  { id: 'it-1', subjectId: 'it', chapterNo: 1, title: 'Communication Skills & Self-Management', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'it-2', subjectId: 'it', chapterNo: 2, title: 'ICT Skills & Digital Documentation (Adv)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'it-3', subjectId: 'it', chapterNo: 3, title: 'Electronic Spreadsheet (Advanced Formulas)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'it-4', subjectId: 'it', chapterNo: 4, title: 'Database Management System (SQL & Tables)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'it-5', subjectId: 'it', chapterNo: 5, title: 'Web Applications & Network Security', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },

  // SOCIAL SCIENCE
  { id: 'ss-1', subjectId: 'ss', chapterNo: 1, title: 'The Rise of Nationalism in Europe', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'ss-2', subjectId: 'ss', chapterNo: 2, title: 'Nationalism in India (Gandhi & Movements)', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'ss-3', subjectId: 'ss', chapterNo: 3, title: 'Resources and Development & Agriculture', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'ss-4', subjectId: 'ss', chapterNo: 4, title: 'Minerals and Energy Resources', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'ss-5', subjectId: 'ss', chapterNo: 5, title: 'Power Sharing and Federalism', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
  { id: 'ss-6', subjectId: 'ss', chapterNo: 6, title: 'Money and Credit & Globalisation', status: 'NOT_STARTED', weakTag: false, notesCount: 0, questionsCount: 0 },
];

export const INITIAL_PDFS: PDFDocument[] = [
  {
    id: 'pdf-m-1',
    subjectId: 'math',
    type: 'NOTE',
    title: 'Formula Sheet: Real Numbers & Polynomials',
    chapterTag: 'Real Numbers',
    fileSize: 42000,
    addedDate: '2026-10-01',
    lastOpenedDate: undefined,
    isFavorite: false,
    blob: makeSamplePdfBlob('Real Numbers & Polynomials Formula Sheet', 'Mathematics', 'Euclid Division Lemma, Fundamental Theorem of Arithmetic, zeroes sum/product.'),
    attemptedCount: 0,
    correctCount: 0,
    redoCount: 0,
    totalQuestions: 0,
  },
  {
    id: 'pdf-m-2',
    subjectId: 'math',
    type: 'QUESTION_PAPER',
    title: 'CBSE Standard Math Model Paper',
    chapterTag: 'Full Syllabus',
    fileSize: 95000,
    addedDate: '2026-10-01',
    lastOpenedDate: undefined,
    isFavorite: false,
    blob: makeSamplePdfBlob('CBSE Standard Math Model Paper', 'Mathematics', 'Sections A, B, C, D, E with Case Based Questions.'),
    attemptedCount: 0,
    correctCount: 0,
    redoCount: 0,
    totalQuestions: 38,
  },
  {
    id: 'pdf-s-1',
    subjectId: 'science',
    type: 'NOTE',
    title: 'Electricity Master Circuit Diagram Guide',
    chapterTag: 'Electricity',
    fileSize: 58000,
    addedDate: '2026-10-01',
    lastOpenedDate: undefined,
    isFavorite: false,
    blob: makeSamplePdfBlob('Electricity Master Circuit Guide', 'Science', 'Resistors in series/parallel, Joule heating, electric power derivations.'),
    attemptedCount: 0,
    correctCount: 0,
    redoCount: 0,
    totalQuestions: 0,
  },
  {
    id: 'pdf-s-2',
    subjectId: 'science',
    type: 'QUESTION_PAPER',
    title: 'Carbon Compounds Exemplar & PYQs',
    chapterTag: 'Carbon & Compounds',
    fileSize: 74000,
    addedDate: '2026-10-01',
    lastOpenedDate: undefined,
    isFavorite: false,
    blob: makeSamplePdfBlob('Carbon Compounds PYQ Bank', 'Science', 'Homologous series, isomerism, saponification, esterification.'),
    attemptedCount: 0,
    correctCount: 0,
    redoCount: 0,
    totalQuestions: 25,
  },
  {
    id: 'pdf-k-1',
    subjectId: 'kannada',
    type: 'NOTE',
    title: 'ಕನ್ನಡ ಸಾಹಿತ್ಯ ಸಾರಾಂಶ & ವ್ಯಾಕರಣ (Grammar)',
    chapterTag: 'ಯುದ್ಧ & ಸಂಧಿಗಳು',
    fileSize: 34000,
    addedDate: '2026-10-01',
    isFavorite: false,
    blob: makeSamplePdfBlob('Kannada Grammar & Summary', 'Kannada', 'ಸಂಧಿಗಳು, ಸಮಾಸಗಳು, ಕವಿ ಪರಿಚಯ, ಭಾವಾರ್ಥಗಳು.'),
    attemptedCount: 0,
    correctCount: 0,
    redoCount: 0,
    totalQuestions: 0,
  },
];

export const INITIAL_ROUTINE_SLOTS: RoutineSlot[] = [
  // Monday: School Day
  { id: 'r-0-1', dayOfWeek: 0, slotIndex: 0, startTime: '17:00', durationMinutes: 45, subjectId: 'math', topic: 'Triangles Similarity Proofs', type: 'LEARN' },
  { id: 'r-0-2', dayOfWeek: 0, slotIndex: 1, startTime: '17:50', durationMinutes: 45, subjectId: 'science', topic: 'Carbon Homologous Series', type: 'PRACTISE' },
  { id: 'r-0-3', dayOfWeek: 0, slotIndex: 2, startTime: '19:00', durationMinutes: 45, subjectId: 'kannada', topic: 'ಶಬರಿ ಪ್ರಶ್ನೋತ್ತರಗಳು', type: 'REVISE' },

  // Tuesday
  { id: 'r-1-1', dayOfWeek: 1, slotIndex: 0, startTime: '17:00', durationMinutes: 45, subjectId: 'science', topic: 'Electricity Numerical Problems', type: 'PRACTISE' },
  { id: 'r-1-2', dayOfWeek: 1, slotIndex: 1, startTime: '17:50', durationMinutes: 45, subjectId: 'ss', topic: 'Nationalism in India Timeline', type: 'REVISE' },
  { id: 'r-1-3', dayOfWeek: 1, slotIndex: 2, startTime: '19:00', durationMinutes: 45, subjectId: 'english', topic: 'Nelson Mandela Speech Analysis', type: 'LEARN' },

  // Wednesday
  { id: 'r-2-1', dayOfWeek: 2, slotIndex: 0, startTime: '17:00', durationMinutes: 45, subjectId: 'math', topic: 'Trigonometric Identities Q1-Q10', type: 'PRACTISE' },
  { id: 'r-2-2', dayOfWeek: 2, slotIndex: 1, startTime: '17:50', durationMinutes: 45, subjectId: 'it', topic: 'DBMS SQL Queries & Foreign Keys', type: 'LEARN' },
  { id: 'r-2-3', dayOfWeek: 2, slotIndex: 2, startTime: '19:00', durationMinutes: 45, subjectId: 'science', topic: 'Light Ray Diagrams Practice', type: 'REVISE' },

  // Thursday
  { id: 'r-3-1', dayOfWeek: 3, slotIndex: 0, startTime: '17:00', durationMinutes: 45, subjectId: 'ss', topic: 'Federalism Case Studies', type: 'LEARN' },
  { id: 'r-3-2', dayOfWeek: 3, slotIndex: 1, startTime: '17:50', durationMinutes: 45, subjectId: 'math', topic: 'Surface Areas Word Problems', type: 'PRACTISE' },
  { id: 'r-3-3', dayOfWeek: 3, slotIndex: 2, startTime: '19:00', durationMinutes: 45, subjectId: 'kannada', topic: 'ವ್ಯಾಕರಣ & ಗಾದೆ ಮಾತುಗಳು', type: 'REVISE' },

  // Friday
  { id: 'r-4-1', dayOfWeek: 4, slotIndex: 0, startTime: '17:00', durationMinutes: 45, subjectId: 'science', topic: 'Life Processes Excretion Diagram', type: 'REVISE' },
  { id: 'r-4-2', dayOfWeek: 4, slotIndex: 1, startTime: '17:50', durationMinutes: 45, subjectId: 'english', topic: 'Formal Letter Writing & Grammar', type: 'PRACTISE' },
  { id: 'r-4-3', dayOfWeek: 4, slotIndex: 2, startTime: '19:00', durationMinutes: 45, subjectId: 'it', topic: 'Web Apps Network Security Notes', type: 'LEARN' },

  // Saturday: Deep Practice
  { id: 'r-5-1', dayOfWeek: 5, slotIndex: 0, startTime: '10:00', durationMinutes: 60, subjectId: 'math', topic: 'Previous Year 5-Mark Questions', type: 'PRACTISE' },
  { id: 'r-5-2', dayOfWeek: 5, slotIndex: 1, startTime: '11:15', durationMinutes: 60, subjectId: 'science', topic: 'Acids & Salts Chemical Equations', type: 'PRACTISE' },
  { id: 'r-5-3', dayOfWeek: 5, slotIndex: 2, startTime: '16:00', durationMinutes: 45, subjectId: 'ss', topic: 'Geography Map Pointing Practice', type: 'REVISE' },

  // Sunday: Weekly Boss Fight / Mock Test Sprint
  { id: 'r-6-1', dayOfWeek: 6, slotIndex: 0, startTime: '09:30', durationMinutes: 90, subjectId: 'math', topic: 'Full Chapter Mock Test: Algebra & Trig', type: 'TEST' },
  { id: 'r-6-2', dayOfWeek: 6, slotIndex: 1, startTime: '14:00', durationMinutes: 60, subjectId: 'science', topic: 'Weekly Revision Sweep (Chemistry)', type: 'REVISE' },
  { id: 'r-6-3', dayOfWeek: 6, slotIndex: 2, startTime: '16:00', durationMinutes: 45, subjectId: 'kannada', topic: 'ಪದ್ಯ ಭಾಗ್ಯಶಿಲ್ಪಿಗಳು ಪ್ರಶ್ನೆಗಳು', type: 'REVISE' },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-1',
    key: 'STREAK_7',
    title: '7-Day Streak',
    description: 'Maintain study consistency for 7 consecutive quest days.',
    icon: '🔥',
    unlocked: false,
    xpReward: 300,
    coinReward: 150,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: 'ach-2',
    key: 'SCIENCE_SLAYER',
    title: 'Science Slayer',
    description: 'Master at least 5 Science syllabus chapters.',
    icon: '⚡',
    unlocked: false,
    xpReward: 500,
    coinReward: 250,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'ach-3',
    key: 'PDFS_10',
    title: '10 PDFs Devoured',
    description: 'Upload and study 10 offline note sheets or question banks.',
    icon: '📚',
    unlocked: false,
    xpReward: 400,
    coinReward: 200,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'ach-4',
    key: 'REVISION_SWEEP',
    title: 'Full Revision Sweep',
    description: 'Complete all routine quests in a single week with no backlog.',
    icon: '⚔️',
    unlocked: false,
    xpReward: 600,
    coinReward: 300,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: 'ach-5',
    key: 'NO_ZERO_DAYS',
    title: 'No Zero Days',
    description: 'Log at least 45 minutes of active focus on 14 quest days.',
    icon: '🛡️',
    unlocked: false,
    xpReward: 500,
    coinReward: 250,
    progress: 0,
    maxProgress: 14,
  },
  {
    id: 'ach-6',
    key: 'MATH_MARATHON',
    title: 'Math Marathon',
    description: 'Log 20 total hours of Mathematics problem solving.',
    icon: '📐',
    unlocked: false,
    xpReward: 750,
    coinReward: 400,
    progress: 0,
    maxProgress: 20,
  },
  {
    id: 'ach-7',
    key: 'BOSS_FIGHTER',
    title: 'Boss Paper Vanquished',
    description: 'Attempt and score ≥ 80% on a full CBSE Board Mock Test.',
    icon: '👑',
    unlocked: false,
    xpReward: 1000,
    coinReward: 500,
    progress: 0,
    maxProgress: 1,
  },
];

export const INITIAL_SHOP_ITEMS: ShopItem[] = [
  // THEMES
  {
    id: 'shop-th-cyber',
    title: 'Cyber Neon Protocol',
    costCoins: 0,
    category: 'THEME',
    icon: '🌐',
    description: 'High-contrast obsidian dark with cyan and magenta neon borders.',
    redeemedCount: 1,
  },
  {
    id: 'shop-th-emerald',
    title: 'Emerald Knight',
    costCoins: 400,
    category: 'THEME',
    icon: '🌲',
    description: 'Forest obsidian theme inspired by deep quest woods.',
    redeemedCount: 0,
  },
  {
    id: 'shop-th-amethyst',
    title: 'Arcane Amethyst',
    costCoins: 600,
    category: 'THEME',
    icon: '🔮',
    description: 'Mystic violet accents for nocturnal study sorcerers.',
    redeemedCount: 0,
  },
  {
    id: 'shop-th-sunset',
    title: 'Solar Flare Gold',
    costCoins: 800,
    category: 'THEME',
    icon: '☀️',
    description: 'Warm gold and solar amber highlights honoring topper glory.',
    redeemedCount: 0,
  },

  // AVATARS / HATS
  {
    id: 'shop-av-quill',
    title: 'Scholar Quill Hat',
    costCoins: 150,
    category: 'AVATAR',
    icon: '🪶',
    description: 'Classic scholar cap with enchanted raven feather.',
    redeemedCount: 0,
  },
  {
    id: 'shop-av-crown',
    title: 'Topper Golden Laurel',
    costCoins: 750,
    category: 'AVATAR',
    icon: '👑',
    description: 'Golden laurel wreath bestowed upon high-percentile warriors.',
    redeemedCount: 0,
  },
  {
    id: 'shop-av-visor',
    title: 'Focus Cyber Visor',
    costCoins: 500,
    category: 'AVATAR',
    icon: '🥽',
    description: 'Tactical HUD visor filtering distractions during pomodoros.',
    redeemedCount: 0,
  },

  // CUSTOM REAL-LIFE REWARDS
  {
    id: 'shop-rl-1',
    title: '1 Hour Guilt-Free Gaming',
    costCoins: 500,
    category: 'REAL_LIFE',
    icon: '🎮',
    description: 'Trade 500 hard-earned coins for an uninterrupted gaming session.',
    redeemedCount: 0,
    custom: false,
  },
  {
    id: 'shop-rl-2',
    title: 'Favorite Ice Cream / Snack',
    costCoins: 350,
    category: 'REAL_LIFE',
    icon: '🍦',
    description: 'Sweet victory treat after completing all weekly daily quests.',
    redeemedCount: 0,
    custom: false,
  },
  {
    id: 'shop-rl-3',
    title: 'Weekend Movie Night',
    costCoins: 1000,
    category: 'REAL_LIFE',
    icon: '🍿',
    description: 'Relax with a full movie or 2 episodes of your favorite show.',
    redeemedCount: 0,
    custom: false,
  },
];

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 1,
  xp: 0,
  coins: 0,
  level: 1,
  streakDays: 0,
  lastActiveDate: '',
  dailyGoalHours: 3.5,
  examDate: '2027-03-01',
  phase2Enabled: false,
  soundEnabled: true,
  hapticsEnabled: true,
  currentTheme: 'cyber',
  avatarHat: '🛡️',
  unlockedItems: ['shop-th-cyber'],
  completedDayDates: [],
};

// ==========================================
// OPTIONAL DEMO DATA (For preview testing only)
// ==========================================
export const DEMO_USER_PROFILE: UserProfile = {
  id: 1,
  xp: 2850,
  coins: 1450,
  level: 8,
  streakDays: 8,
  lastActiveDate: '2026-10-08',
  dailyGoalHours: 3.5,
  examDate: '2027-03-01',
  phase2Enabled: false,
  soundEnabled: true,
  hapticsEnabled: true,
  currentTheme: 'cyber',
  avatarHat: '🪶',
  unlockedItems: ['shop-th-cyber', 'shop-av-quill'],
  completedDayDates: [
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
    '2026-10-05',
    '2026-10-06',
    '2026-10-07',
    '2026-10-08',
  ],
};

export const DEMO_LOGS = [
  { id: 'log-1', dateStr: '2026-10-01', minutes: 120, subjectId: 'math', xp: 200, timestamp: Date.now() - 7 * 86400000 },
  { id: 'log-2', dateStr: '2026-10-02', minutes: 180, subjectId: 'science', xp: 300, timestamp: Date.now() - 6 * 86400000 },
  { id: 'log-3', dateStr: '2026-10-03', minutes: 150, subjectId: 'kannada', xp: 250, timestamp: Date.now() - 5 * 86400000 },
  { id: 'log-4', dateStr: '2026-10-04', minutes: 210, subjectId: 'ss', xp: 350, timestamp: Date.now() - 4 * 86400000 },
  { id: 'log-5', dateStr: '2026-10-05', minutes: 140, subjectId: 'it', xp: 220, timestamp: Date.now() - 3 * 86400000 },
  { id: 'log-6', dateStr: '2026-10-06', minutes: 240, subjectId: 'math', xp: 400, timestamp: Date.now() - 2 * 86400000 },
  { id: 'log-7', dateStr: '2026-10-07', minutes: 190, subjectId: 'science', xp: 310, timestamp: Date.now() - 1 * 86400000 },
  { id: 'log-8', dateStr: '2026-10-08', minutes: 165, subjectId: 'english', xp: 280, timestamp: Date.now() },
];
