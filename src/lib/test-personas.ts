// ─── Test Personas ────────────────────────────────────────────────────────────
// Five interconnected personas for testing the Curious experience.
//
// Connection graph:
//   Elena (master) ──gift──> Marcus (partner)
//   Elena ──gift──> Priya (friend)
//   Elena ──gift──> Leo (son)
//   Leo ──gift──> Jade (girlfriend)

// ─── IDs ──────────────────────────────────────────────────────────────────────

export const PERSONA_IDS = {
  elena: "00000000-0000-0000-0000-000000000001",
  marcus: "00000000-0000-0000-0000-000000000002",
  priya: "00000000-0000-0000-0000-000000000003",
  leo: "00000000-0000-0000-0000-000000000004",
  jade: "00000000-0000-0000-0000-000000000005",
} as const;

const GIFT_IDS = {
  elenaToMarcus: "00000000-0000-0000-0000-100000000001",
  elenaToPriya: "00000000-0000-0000-0000-100000000002",
  elenaToLeo: "00000000-0000-0000-0000-100000000003",
  leoToJade: "00000000-0000-0000-0000-100000000004",
} as const;

const CONNECTION_IDS = {
  elenaMarcus: "00000000-0000-0000-0000-200000000001",
  elenaPriya: "00000000-0000-0000-0000-200000000002",
  elenaLeo: "00000000-0000-0000-0000-200000000003",
  leoJade: "00000000-0000-0000-0000-200000000004",
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TestPersona {
  id: string;
  email: string;
  displayName: string;
  age: number;
  bio: string;
  color: string; // for dashboard UI
  voiceStyle: { tone: string; directness: number; metaphor_affinity: number };
  totalConversations: number;
  facets: TestFacet[];
  conversations: TestConversation[];
  reflections: TestReflection[];
}

export interface TestFacet {
  domain: string;
  content: string;
  confidence: number;
  depth: number;
}

export interface TestConversation {
  sessionSummary: string;
  themes: string[];
  messages: { role: "agent" | "user"; content: string }[];
}

export interface TestReflection {
  title: string;
  content: string;
  domains: string[];
}

export interface TestGift {
  id: string;
  fromPersonaId: string;
  toPersonaId: string;
  recipientEmail: string;
  briefing: string;
  relationshipLabel: string;
  inviteCode: string;
  status: "accepted";
  curiosityThreads: { domain: string; thread: string }[];
}

export interface TestConnection {
  id: string;
  giftId: string;
  userAId: string;
  userBId: string;
  tierAtoB: "surface" | "personal" | "deep";
  tierBtoA: "surface" | "personal" | "deep";
}

// ─── Elena Vasquez (Master User) ──────────────────────────────────────────────

const elena: TestPersona = {
  id: PERSONA_IDS.elena,
  email: "elena.vasquez@test.curious.app",
  displayName: "Elena",
  age: 53,
  bio: "Architect who designs public libraries. Married to Marcus for 28 years. Mother of Leo (24) and Sofia (21). Reads voraciously, hikes alone, believes buildings should make people feel something.",
  color: "#8a6e53",
  voiceStyle: { tone: "warm-reflective", directness: 0.6, metaphor_affinity: 0.8 },
  totalConversations: 15,
  facets: [
    // Identity
    { domain: "identity", content: "Architect specializing in public libraries and community spaces. Has designed seven libraries across the Pacific Northwest.", confidence: 0.95, depth: 3 },
    { domain: "identity", content: "Daughter of Mexican immigrants. Father was a carpenter, mother a schoolteacher. Grew up in Tucson.", confidence: 0.9, depth: 3 },
    { domain: "identity", content: "Thinks of herself as a 'translator between spaces and people' rather than just an architect.", confidence: 0.85, depth: 4 },
    // Values
    { domain: "values", content: "Believes public spaces are acts of democracy. A library says 'you belong here' to everyone who walks in.", confidence: 0.9, depth: 4 },
    { domain: "values", content: "Craftsmanship over efficiency. Would rather spend three months on a detail that most people won't notice than cut corners.", confidence: 0.85, depth: 3 },
    { domain: "values", content: "Fiercely protective of solitude. Hikes alone every Saturday morning, considers it non-negotiable.", confidence: 0.8, depth: 3 },
    // Relationships
    { domain: "relationships", content: "Married to Marcus, a high school history teacher, for 28 years. Describes him as 'the most patient person in any room.'", confidence: 0.95, depth: 3 },
    { domain: "relationships", content: "Son Leo (24) is a software developer who makes electronic music. She worries he doesn't see his own talent.", confidence: 0.85, depth: 3 },
    { domain: "relationships", content: "Daughter Sofia (21) is studying anthropology in Buenos Aires. They communicate through long voice notes.", confidence: 0.8, depth: 2 },
    { domain: "relationships", content: "Best friend Priya since college. They met when Priya borrowed her camera and never returned it. Priya is going through a divorce and Elena feels helpless.", confidence: 0.85, depth: 4 },
    // Purpose
    { domain: "purpose", content: "Wants to design spaces that outlast her. The Bend Public Library is the project she's most proud of — she still visits to watch people use it.", confidence: 0.9, depth: 4 },
    { domain: "purpose", content: "Increasingly drawn to teaching. Guest lectures at Portland State and finds the students' questions more interesting than client meetings.", confidence: 0.7, depth: 3 },
    // Experiences
    { domain: "experiences", content: "Spent a year in Oaxaca after college studying vernacular architecture. It changed how she thinks about who buildings are for.", confidence: 0.85, depth: 3 },
    { domain: "experiences", content: "Lost her father three years ago. He built the bookshelves in every house they lived in. She keeps one of his hand planes on her desk.", confidence: 0.9, depth: 5 },
    { domain: "experiences", content: "Ran her first marathon at 50. Not fast, but she finished. Marcus and the kids were at mile 22 with a sign that said 'Your buildings are still standing.'", confidence: 0.75, depth: 2 },
    // Patterns
    { domain: "patterns", content: "Tends to take on too much and then retreat into solitude when overwhelmed, rather than asking for help.", confidence: 0.8, depth: 4 },
    { domain: "patterns", content: "Uses spatial metaphors constantly. Relationships have 'foundations,' conversations have 'rooms,' grief has 'hallways.'", confidence: 0.85, depth: 4 },
    { domain: "patterns", content: "Most energized when starting a project, can struggle with the middle phase when the vision meets reality.", confidence: 0.7, depth: 3 },
    // Aspirations
    { domain: "aspirations", content: "Wants to write a book about the relationship between public architecture and belonging. Has 40 pages of notes but hasn't started.", confidence: 0.8, depth: 3 },
    { domain: "aspirations", content: "Dreams of designing a library in her parents' hometown in Mexico. Has sketched it dozens of times.", confidence: 0.85, depth: 4 },
    // Struggles
    { domain: "struggles", content: "Feels the tension between ambition and presence. Worries she's been more devoted to buildings than to the people inside her own house.", confidence: 0.85, depth: 5 },
    { domain: "struggles", content: "Her mother has early-stage dementia. Elena is trying to capture her stories before they disappear.", confidence: 0.8, depth: 4 },
    // Joys
    { domain: "joys", content: "The moment a building opens and strangers walk in and sit down like they belong there. Nothing else compares.", confidence: 0.9, depth: 4 },
    { domain: "joys", content: "Saturday morning hikes. The first hour of silence before the trail gets busy. She calls it 'the only church I attend.'", confidence: 0.85, depth: 3 },
    { domain: "joys", content: "Cooking with Marcus on Sunday evenings. He does the chopping, she does the seasoning. They've done this for 25 years.", confidence: 0.8, depth: 2 },
    // Worldview
    { domain: "worldview", content: "Believes that how a society treats its public spaces reveals its true values. Parking lots are a moral failing.", confidence: 0.85, depth: 4 },
    { domain: "worldview", content: "Thinks the most important conversations happen in the margins — while walking, while cooking, while driving. Never when you sit someone down and say 'we need to talk.'", confidence: 0.8, depth: 4 },
  ],
  conversations: [
    {
      sessionSummary: "First conversation. Elena shared her work as an architect and her focus on public libraries. Mentioned her family briefly.",
      themes: ["architecture", "public spaces", "family"],
      messages: [
        { role: "agent", content: "What do you spend most of your days doing?" },
        { role: "user", content: "I'm an architect. I design public libraries, mostly. I know that sounds niche but it's actually the thing I care about most — these spaces where anyone can walk in and just... be. I've been doing it for about twenty years now." },
        { role: "agent", content: "What made you land on libraries specifically, rather than other kinds of buildings?" },
        { role: "user", content: "My mother was a schoolteacher and my father was a carpenter. Growing up, the library was the one place that felt like it belonged to us, even though we didn't have much. My parents were immigrants from Mexico and the library didn't care about that. It just said 'come in.' I think I've been trying to build that feeling ever since." },
        { role: "agent", content: "Is there a particular library you've designed that still feels like yours?" },
        { role: "user", content: "The Bend Public Library in Oregon. I finished it six years ago and I still drive out there sometimes just to sit in the reading room and watch people use it. There's this one corner with a big window where teenagers always end up, and I didn't plan that — they just found it. That's when you know you got something right." },
      ],
    },
    {
      sessionSummary: "Elena talked about her relationship with Marcus, their Sunday cooking ritual, and how they communicate differently.",
      themes: ["marriage", "communication", "rituals"],
      messages: [
        { role: "agent", content: "What's your favourite part of an ordinary week?" },
        { role: "user", content: "Sunday evening cooking with Marcus. He chops, I season. We've been doing it for 25 years. We don't even talk that much during it — it's more like this shared rhythm. Sometimes I think we communicate better through cooking than through conversation." },
        { role: "agent", content: "How did that ritual start?" },
        { role: "user", content: "Honestly, it started because we were both terrible cooks when we got married and we figured if we split the work at least the failures would be shared. But somewhere along the way it became the thing. Leo and Sofia used to sit at the counter and do homework while we cooked. Now they're gone and it's just us and I think we both hold onto it a little tighter because of that." },
        { role: "agent", content: "You said you communicate better through cooking than conversation. What does Marcus do when he really needs to tell you something important?" },
        { role: "user", content: "He waits. That man has more patience than anyone I've ever met. He teaches high school history and I think teenagers have trained him to know that if you push, people close up. So he just... stays nearby until I'm ready. It used to drive me crazy but now I think it might be the most generous thing anyone has ever done for me." },
      ],
    },
    {
      sessionSummary: "Deeper conversation about Elena's father's death and the hand plane she keeps on her desk. Her mother's dementia came up.",
      themes: ["grief", "parents", "legacy", "memory"],
      messages: [
        { role: "agent", content: "You mentioned your father was a carpenter. What's something he built that you still think about?" },
        { role: "user", content: "Bookshelves. In every house we lived in — and we moved a lot — the first thing he'd do is build bookshelves. Custom ones, fitted to the walls. My mother would fill them before the kitchen was unpacked. When he died three years ago, I took one of his hand planes. It sits on my desk now. I touch it sometimes when I'm stuck on a design." },
        { role: "agent", content: "What happens when you touch it?" },
        { role: "user", content: "I remember his hands. He had these enormous hands that were always nicked up from work. And I think about how he made things fit — not just wood, but us, into places that weren't built for us. That's what I'm trying to do too, I think. Make spaces where people fit." },
        { role: "agent", content: "How is your mother doing now?" },
        { role: "user", content: "She has early-stage dementia. Some days she's completely herself, sharp and funny and telling me I work too much. Other days she asks where my father is and I have to decide whether to tell her again or just say he's out. I've started recording her stories. I sit with her and ask about Mexico, about her teaching years. I'm terrified of losing those before I can keep them." },
      ],
    },
    {
      sessionSummary: "Elena reflected on her aspirations — the book she wants to write, the library in Mexico she dreams of building.",
      themes: ["aspirations", "writing", "Mexico", "legacy"],
      messages: [
        { role: "agent", content: "What's something you want to make that you haven't started yet?" },
        { role: "user", content: "A book. About public architecture and belonging — how the spaces a society builds tell you who it thinks matters. I have forty pages of notes and about a hundred bookmarks and zero actual chapters. I keep telling myself I'll start when the current project wraps up but there's always a current project." },
        { role: "agent", content: "What would the first chapter be about?" },
        { role: "user", content: "The library in my parents' hometown in Oaxaca. There isn't one. I've sketched it dozens of times — this low building with a courtyard, thick walls for the heat, a children's section that opens onto a garden. The book would start there because that's where the whole idea begins for me: what does it mean that some places get libraries and some don't?" },
        { role: "agent", content: "Have you ever been close to actually building it?" },
        { role: "user", content: "I talked to the municipal government once, years ago. They were polite but it was clear they had other priorities. Water, roads. And they're right. But I can't let it go. It feels like the project I'm supposed to do. My father would have understood that." },
      ],
    },
    {
      sessionSummary: "Elena explored the tension between her career ambition and her presence in her family. Mentioned worrying about Leo.",
      themes: ["work-life balance", "motherhood", "ambition", "Leo"],
      messages: [
        { role: "agent", content: "When you look at your kids now, what surprises you about who they've become?" },
        { role: "user", content: "Leo surprises me. He's a software developer, which is not what I expected from a kid who used to build forts out of couch cushions and conduct imaginary orchestras. But he also makes electronic music — under the name 'Tidepool' — and when I listen to it I hear something he doesn't let you see in conversation. It's tender and strange and I wish he knew how good it is." },
        { role: "agent", content: "Have you told him?" },
        { role: "user", content: "I've tried. But I think there's this thing where he looks at what I've built — actual buildings — and his music feels less real to him by comparison. I hate that. I never wanted my work to cast a shadow like that." },
        { role: "agent", content: "Do you think your work has cast shadows in other places too?" },
        { role: "user", content: "Yes. I know it has. Marcus would never say it but there were years when I was more married to my firm than to him. And Sofia — she went to Buenos Aires partly because she wanted to be far enough away that people wouldn't introduce her as 'Elena Vasquez's daughter.' I'm proud of what I've built but I'm honest enough to know it came at a cost." },
      ],
    },
  ],
  reflections: [
    {
      title: "The Architecture of Belonging",
      content: "Elena, what strikes me most about you is that you've spent your whole life answering one question: who gets to feel at home? Your father built bookshelves to make rented houses feel permanent. Your mother filled them to make foreign places feel familiar. And you — you've scaled that instinct into an entire career.\n\nThe library in Bend with the corner the teenagers found. Your dream of a library in Oaxaca. Even the way you describe your Saturday hikes — 'the only church I attend' — it's all about finding or making spaces where belonging doesn't require permission.\n\nBut here's the tension I see: you build belonging for strangers and sometimes forget to be present in the spaces you've built at home. You know this. The fact that Sofia went to Buenos Aires partly to escape your shadow, that Leo measures his music against your buildings — these aren't failures, exactly. They're the cost of a particular kind of devotion.\n\nThe book you haven't written, the library you haven't built in Mexico — I think these feel unfinished because they're the projects where the professional and the personal finally merge. They're not about architecture. They're about your parents, your childhood, your answer to the question of who matters.\n\nYou'll write it. The forty pages of notes are not procrastination — they're patience. Your father would recognize the difference.",
      domains: ["identity", "values", "purpose", "relationships", "struggles"],
    },
  ],
};

// ─── Marcus Vasquez (Partner) ─────────────────────────────────────────────────

const marcus: TestPersona = {
  id: PERSONA_IDS.marcus,
  email: "marcus.vasquez@test.curious.app",
  displayName: "Marcus",
  age: 55,
  bio: "High school history teacher for 30 years. Coaches junior baseball. Writing a book about local history that keeps growing. Jazz lover. The quiet center of the Vasquez family.",
  color: "#5f4b3d",
  voiceStyle: { tone: "gentle-dry", directness: 0.4, metaphor_affinity: 0.4 },
  totalConversations: 8,
  facets: [
    { domain: "identity", content: "High school history teacher for 30 years. Teaches AP US History and a self-designed course on local history.", confidence: 0.9, depth: 2 },
    { domain: "identity", content: "Son of a postal worker and a nurse. Grew up in the same town he now teaches in. Never wanted to leave.", confidence: 0.8, depth: 3 },
    { domain: "values", content: "Patience is his core value. Believes understanding takes time and most people give up too early.", confidence: 0.85, depth: 3 },
    { domain: "values", content: "Local matters more than grand. Would rather know one town deeply than travel the world.", confidence: 0.8, depth: 3 },
    { domain: "relationships", content: "Married to Elena for 28 years. Admires her ambition but sometimes feels like the supporting character in her story.", confidence: 0.75, depth: 4 },
    { domain: "relationships", content: "Coaches junior baseball. Gets emotional at the end-of-season banquet every year but hides it well.", confidence: 0.7, depth: 2 },
    { domain: "purpose", content: "Has been writing a book about the town's history for six years. Keeps finding new threads. Elena calls it his 'infinite project.'", confidence: 0.85, depth: 3 },
    { domain: "experiences", content: "Had a student named David who was about to drop out. Marcus drove him to school every morning for a semester. David is now a teacher himself.", confidence: 0.8, depth: 3 },
    { domain: "patterns", content: "Deflects compliments by making a dry joke. Uses humor to avoid direct vulnerability.", confidence: 0.7, depth: 3 },
    { domain: "joys", content: "Jazz. Plays piano badly but listens expertly. Has a vinyl collection organized by mood rather than alphabet.", confidence: 0.85, depth: 2 },
    { domain: "joys", content: "That moment when a student's eyes change — when history stops being dates and becomes a story that matters to them.", confidence: 0.9, depth: 4 },
    { domain: "struggles", content: "Wonders if staying in one place his whole life was contentment or cowardice. Elena has built things across the country. He built one classroom.", confidence: 0.7, depth: 4 },
    { domain: "worldview", content: "History isn't what happened — it's what people decided to remember. The most important stories are the ones that didn't make it into the textbook.", confidence: 0.85, depth: 3 },
  ],
  conversations: [
    {
      sessionSummary: "First conversation. Marcus talked about teaching history and what keeps him in the classroom after 30 years.",
      themes: ["teaching", "history", "vocation"],
      messages: [
        { role: "agent", content: "How do you spend your days?" },
        { role: "user", content: "I teach history. High school. AP US History and a course I designed myself on local history — the history of this town specifically. I've been doing it for 30 years now, which makes me either dedicated or slow to change. My wife would say both." },
        { role: "agent", content: "What keeps you in the classroom after 30 years?" },
        { role: "user", content: "There's this moment — and it doesn't happen every day, sometimes not even every month — when a kid stops seeing history as a thing that happened to other people and starts seeing it as the reason their world looks the way it does. That moment. That's the whole job." },
        { role: "agent", content: "Can you tell me about a specific student where you saw that happen?" },
        { role: "user", content: "David. He was a junior, about to drop out. His mom worked nights and he was basically raising his younger siblings. I started driving him to school in the mornings — not because I'm a saint, I just had the same commute. But in those drives we'd talk about history and he started to see that his family's story — immigrant family, working class, invisible to the system — that IS history. He's a teacher now. Middle school." },
      ],
    },
    {
      sessionSummary: "Marcus talked about jazz, his vinyl collection, and how music is where he's most himself.",
      themes: ["jazz", "music", "identity", "solitude"],
      messages: [
        { role: "agent", content: "What do you do when you're not teaching?" },
        { role: "user", content: "Listen to jazz. I have a vinyl collection that takes up most of one wall of our living room. Elena designed a custom shelf for it, which is probably the most romantic thing she's ever done for me, though she'd say it was an architectural challenge, not a love letter." },
        { role: "agent", content: "How do you organize them?" },
        { role: "user", content: "By mood. Not alphabetical, not chronological. I have a section for 'Sunday morning coffee,' one for 'grading papers at midnight,' one for 'the kids just left for college.' My system makes perfect sense to me and zero sense to anyone else." },
        { role: "agent", content: "Do you play at all?" },
        { role: "user", content: "Piano. Badly. But I play. There's something honest about being bad at something you love. I'll never perform, I'll never be good. But at ten o'clock at night when the house is quiet, I sit at that piano and I'm more myself than at any other moment of the day." },
      ],
    },
    {
      sessionSummary: "Marcus reflected on his relationship with Elena, the dynamic of ambition vs steadiness, and his book project.",
      themes: ["marriage", "ambition", "writing", "self-worth"],
      messages: [
        { role: "agent", content: "You mentioned your wife is an architect. What's it like being married to someone who builds things that big?" },
        { role: "user", content: "It's like being married to a weather system. Exciting, beautiful, occasionally you need to take shelter. I mean that with love. Elena is the most passionate person I know. But sometimes I'm at a dinner party and someone asks 'what do you do?' and after Elena has talked about her latest library, I say 'I teach high school' and I can feel the room... adjust its expectations." },
        { role: "agent", content: "How do you handle that adjustment?" },
        { role: "user", content: "I make a joke. Usually something dry enough that only Elena laughs. She has always laughed at my jokes. That might actually be the foundation of our marriage. But honestly — I do wonder sometimes. Thirty years in the same classroom. She's built seven libraries. Am I content or am I just... stuck?" },
        { role: "agent", content: "What does the book you're writing mean to you in that context?" },
        { role: "user", content: "Oh, the infinite project. It's the history of this town — but not the history in the museum. The history in the gaps. The Japanese family that ran a laundry until 1942. The creek they paved over in 1965. I've been working on it for six years. I keep finding new threads and I can't stop pulling them. Maybe it's the one thing I'm building that's mine." },
      ],
    },
  ],
  reflections: [],
};

// ─── Priya Chandran (Friend) ──────────────────────────────────────────────────

const priya: TestPersona = {
  id: PERSONA_IDS.priya,
  email: "priya.chandran@test.curious.app",
  displayName: "Priya",
  age: 51,
  bio: "Documentary filmmaker. Elena's oldest friend. Recently divorced. Has traveled to 40 countries with a camera. Fierce, restless, questioning everything.",
  color: "#b39b7e",
  voiceStyle: { tone: "direct-warm", directness: 0.8, metaphor_affinity: 0.6 },
  totalConversations: 4,
  facets: [
    { domain: "identity", content: "Documentary filmmaker. Has made six feature-length documentaries, mostly about people living on margins — fishermen, migrant workers, street musicians.", confidence: 0.85, depth: 2 },
    { domain: "identity", content: "Indian-American. Parents were academics who expected her to become a doctor. Choosing film was a rebellion she's still proud of.", confidence: 0.8, depth: 3 },
    { domain: "relationships", content: "Recently divorced after 18 years. Says it was 'slow erosion, not an earthquake.' She traveled; he wanted her home.", confidence: 0.8, depth: 3 },
    { domain: "relationships", content: "Best friend is Elena, since college. Elena is the one person who never asked her to be less intense.", confidence: 0.75, depth: 3 },
    { domain: "experiences", content: "Made a documentary about fishermen in Kerala that won a small festival prize. Considers it her truest work — she lived with the families for four months.", confidence: 0.85, depth: 3 },
    { domain: "struggles", content: "Fears her best work is behind her. The Kerala film was ten years ago. Everything since has felt like she's trying to recapture something.", confidence: 0.75, depth: 4 },
    { domain: "struggles", content: "Loneliness after the divorce is different from the loneliness inside the marriage. This one is louder.", confidence: 0.7, depth: 4 },
    { domain: "aspirations", content: "Wants to make a film about her parents' immigration story. Keeps circling the idea but hasn't committed. 'The closer the subject, the harder it is to find the frame.'", confidence: 0.7, depth: 3 },
  ],
  conversations: [
    {
      sessionSummary: "First conversation. Priya introduced herself as a filmmaker, talked about the Kerala documentary.",
      themes: ["filmmaking", "Kerala", "vocation"],
      messages: [
        { role: "agent", content: "What kind of work do you do?" },
        { role: "user", content: "I make documentaries. I've made six, all about people living on the edges of things — fishermen in Kerala, street musicians in Buenos Aires, migrant farmworkers in California. I go to a place, I stay, I listen, and eventually a story shows up. At least that's how it used to work." },
        { role: "agent", content: "What do you mean, 'used to work'?" },
        { role: "user", content: "The Kerala film was ten years ago. I lived with three fishing families for four months. The film was honest and small and true. Everything since has felt like I'm performing the version of filmmaking I used to actually do. The muscle memory is there but the nerve is... I don't know. Quieter." },
        { role: "agent", content: "What was different about Kerala?" },
        { role: "user", content: "I didn't know what I was looking for. I just went. And the families let me in because I wasn't trying to tell their story — I was trying to understand it. There's a difference. Now I show up with too many ideas, too much intention. The lens gets in the way." },
      ],
    },
    {
      sessionSummary: "Priya talked about her divorce and the shape loneliness takes now.",
      themes: ["divorce", "loneliness", "identity"],
      messages: [
        { role: "agent", content: "You mentioned the last few years have been a time of change. What's shifted the most?" },
        { role: "user", content: "My marriage ended. Eighteen years. It wasn't dramatic — no affair, no explosion. Just slow erosion. I traveled for months at a time. He wanted me home. I wanted home to be wherever the work was. Eventually we were two polite strangers sharing a refrigerator." },
        { role: "agent", content: "What's surprised you about being on the other side of it?" },
        { role: "user", content: "The loneliness is different. Inside the marriage, it was this dull ache you could ignore because someone was technically there. Now it's loud. It has a sound — like a room with too much echo. But it's also cleaner. More honest. I'd rather be lonely alone than lonely next to someone." },
      ],
    },
  ],
  reflections: [],
};

// ─── Leo Vasquez (Son) ────────────────────────────────────────────────────────

const leo: TestPersona = {
  id: PERSONA_IDS.leo,
  email: "leo.vasquez@test.curious.app",
  displayName: "Leo",
  age: 24,
  bio: "Software developer by day, electronic music producer (Tidepool) by night. Elena and Marcus's son. Dating Jade. Quietly talented, loudly self-doubting.",
  color: "#725a46",
  voiceStyle: { tone: "casual-thoughtful", directness: 0.5, metaphor_affinity: 0.5 },
  totalConversations: 6,
  facets: [
    { domain: "identity", content: "Software developer at a startup that makes tools for urban planners. Chose the job partly because it felt adjacent to what his mother does.", confidence: 0.8, depth: 3 },
    { domain: "identity", content: "Produces electronic music under the name 'Tidepool.' Ambient, layered, textural. Has released two EPs on Bandcamp that about 200 people have heard.", confidence: 0.85, depth: 3 },
    { domain: "values", content: "Authenticity matters more to him than success. Would rather make something honest that 50 people love than something polished that thousands stream.", confidence: 0.8, depth: 3 },
    { domain: "relationships", content: "Dating Jade, a marine biology grad student, for two years. She's the first person who made him feel like his music was real.", confidence: 0.8, depth: 3 },
    { domain: "relationships", content: "Loves and is intimidated by his mother Elena. Her buildings feel monumental; his music feels ephemeral.", confidence: 0.75, depth: 4 },
    { domain: "relationships", content: "Close to his father Marcus in a quiet way. They bond over music — Marcus plays jazz piano, Leo makes ambient electronic. Different languages, same impulse.", confidence: 0.8, depth: 3 },
    { domain: "experiences", content: "Went to a Ryuichi Sakamoto concert at 16 and it rewired his brain. 'That's when I understood that electronic music could feel like weather.'", confidence: 0.85, depth: 3 },
    { domain: "patterns", content: "Compares himself to his mother constantly, always unfavorably. She builds things that last; he makes things that disappear into headphones.", confidence: 0.7, depth: 4 },
    { domain: "struggles", content: "Imposter syndrome at work and in music. Feels like he's cosplaying as both a developer and an artist without fully being either.", confidence: 0.75, depth: 4 },
    { domain: "joys", content: "The moment in music production when a track 'finds itself' — when the layers click and it stops being sounds and becomes a feeling. He chases that moment.", confidence: 0.85, depth: 3 },
    { domain: "aspirations", content: "Wants to score a film someday. Hasn't told anyone except Jade.", confidence: 0.7, depth: 3 },
  ],
  conversations: [
    {
      sessionSummary: "First conversation. Leo talked about his job and his music, the tension between the two.",
      themes: ["work", "music", "identity"],
      messages: [
        { role: "agent", content: "What are you working on these days?" },
        { role: "user", content: "By day I write software — I work at a startup that builds tools for urban planners. It's interesting enough. But the real work happens after hours. I make electronic music under the name Tidepool. Ambient stuff, lots of textures and field recordings. I have two EPs on Bandcamp that approximately nobody has heard." },
        { role: "agent", content: "What draws you to ambient music specifically?" },
        { role: "user", content: "When I was 16 my dad took me to a Ryuichi Sakamoto concert. And I sat there and realized that music didn't have to be about melody or lyrics or even rhythm. It could be about atmosphere. It could feel like weather. That night I went home and downloaded Ableton and I've been chasing that feeling ever since." },
        { role: "agent", content: "Your dad took you — does he get the music you make?" },
        { role: "user", content: "He plays jazz piano, badly, but with his whole heart. So yeah, he gets the impulse even if the sounds are totally different. My mom... she tries. She sent me a text after my last EP that said 'I listened three times and I hear the ocean in it.' Which was actually perfect because the whole thing was built from tide pool recordings. But I could tell she was trying hard to get it, and the trying is what I noticed." },
      ],
    },
    {
      sessionSummary: "Leo talked about Jade, what she brings to his life, and the shadow of his mother's achievements.",
      themes: ["Jade", "relationships", "comparison", "self-doubt"],
      messages: [
        { role: "agent", content: "Who's someone that makes you feel most like yourself?" },
        { role: "user", content: "Jade. My girlfriend. She's studying marine biology and she gets genuinely excited about kelp forests. When she talks about the ocean, it's like she's describing a person she's in love with. And she listens to my music the same way — not politely, but like she's actually hearing it. She's the first person who made me feel like Tidepool is a real thing, not just a hobby." },
        { role: "agent", content: "What do you mean by 'a real thing'?" },
        { role: "user", content: "My mom designs buildings. Like, actual buildings that people walk into and their lives change. She designed the Bend Public Library and strangers come up to her and tell her it's their favorite place in town. And I make sounds that disappear into headphones. I know that's not a fair comparison but it's the one I make. Every time." },
        { role: "agent", content: "What would it take for your music to feel as real to you as it does to Jade?" },
        { role: "user", content: "I don't know. Maybe scoring something. A film, a game, an installation. Something where the music lives inside another thing and changes it. I haven't told anyone that except Jade. And now you, I guess." },
      ],
    },
    {
      sessionSummary: "Leo explored his relationship with his father and what he's inherited from each parent.",
      themes: ["father", "inheritance", "patience vs restlessness"],
      messages: [
        { role: "agent", content: "What have you inherited from your dad that you're glad about?" },
        { role: "user", content: "Patience. Or at least the potential for it. Dad will spend six years writing a book about local history and not feel anxious about it. He'd rather get it right than get it done. I'm not there yet — I have my mom's restlessness — but I can feel his patience in me when I'm working on music. A track can take months and that feels right." },
        { role: "agent", content: "And from your mom?" },
        { role: "user", content: "The restlessness. And the need to make things. She can't sit still without designing something. I can't sit still without recording something. We're both always building, just in different materials. But she also gave me this... standard. This sense that what you make should matter. Which is great until you're 24 and nothing you've made feels like it matters enough." },
      ],
    },
  ],
  reflections: [],
};

// ─── Jade Kim (Son's Girlfriend) ──────────────────────────────────────────────

const jade: TestPersona = {
  id: PERSONA_IDS.jade,
  email: "jade.kim@test.curious.app",
  displayName: "Jade",
  age: 23,
  bio: "Marine biology grad student. Grew up on the Oregon coast. Studies kelp forest ecosystems. Quiet intensity. Sees the ocean the way Elena sees buildings.",
  color: "#c9b8a2",
  voiceStyle: { tone: "quiet-precise", directness: 0.5, metaphor_affinity: 0.7 },
  totalConversations: 2,
  facets: [
    { domain: "identity", content: "Marine biology graduate student studying kelp forest ecosystems. Grew up on the Oregon coast in a small town called Yachats.", confidence: 0.85, depth: 2 },
    { domain: "identity", content: "Korean-American. Grandmother taught her to pay attention — to tides, to seasons, to the way light changes on water.", confidence: 0.75, depth: 2 },
    { domain: "relationships", content: "Dating Leo for two years. His music reminds her of the ocean — 'it moves the same way, in layers.'", confidence: 0.7, depth: 2 },
    { domain: "joys", content: "Diving. The first thirty seconds underwater when the surface noise disappears and everything simplifies.", confidence: 0.8, depth: 2 },
  ],
  conversations: [
    {
      sessionSummary: "First conversation. Jade talked about growing up on the coast and her relationship with the ocean.",
      themes: ["ocean", "childhood", "grandmother"],
      messages: [
        { role: "agent", content: "Where did you grow up?" },
        { role: "user", content: "Yachats, Oregon. It's a tiny town on the coast, maybe 700 people. The ocean was basically my backyard. My grandmother lived with us and she was the one who taught me to pay attention to it — not just look at it, but actually notice things. The way the tide pools change between morning and afternoon. The color of the water before a storm." },
        { role: "agent", content: "What did your grandmother see when she looked at the ocean?" },
        { role: "user", content: "Time. She grew up in Busan, right on the water, and she'd say the ocean in Oregon sounded different but felt the same. She could tell the weather by the smell of the air. I think she saw the ocean as this... constant. Everything else changes but the water keeps doing what it does. I'm studying marine biology partly because of her — partly because I want to understand the thing she just knew." },
        { role: "agent", content: "What do you see when you dive?" },
        { role: "user", content: "The first thirty seconds are the best. All the surface noise just... stops. And then you're in this world that doesn't care about you at all, and somehow that's the most peaceful feeling I know. The kelp moves like it's breathing. The light comes through in columns. I know it's just biology but it feels like something more." },
      ],
    },
  ],
  reflections: [],
};

// ─── Gifts ────────────────────────────────────────────────────────────────────

export const TEST_GIFTS: TestGift[] = [
  {
    id: GIFT_IDS.elenaToMarcus,
    fromPersonaId: PERSONA_IDS.elena,
    toPersonaId: PERSONA_IDS.marcus,
    recipientEmail: marcus.email,
    briefing: "Marcus is the most patient person I know. He teaches high school history and somehow makes teenagers care about the Civil War. He won't tell you this, but he's been writing a book about our town's history for six years — he keeps finding new threads to pull. Ask him about jazz. Ask him about coaching. He's the kind of man who shows love through showing up, not through grand gestures. He might be quiet at first but there's so much underneath.",
    relationshipLabel: "My husband",
    inviteCode: "test-elena-marcus",
    status: "accepted",
    curiosityThreads: [
      { domain: "purpose", thread: "What does six years of writing about one town's history mean to him? Is the book the point, or is the searching?" },
      { domain: "joys", thread: "Jazz — not just what he listens to, but what he hears. His wife says ask about this." },
      { domain: "relationships", thread: "He coaches junior baseball. What does he see in those kids that keeps him coming back?" },
      { domain: "identity", thread: "He shows love through showing up. Where did he learn that? What does it cost him?" },
    ],
  },
  {
    id: GIFT_IDS.elenaToPriya,
    fromPersonaId: PERSONA_IDS.elena,
    toPersonaId: PERSONA_IDS.priya,
    recipientEmail: priya.email,
    briefing: "Priya is my oldest friend — we met freshman year of college when she borrowed my camera and never gave it back. She's a documentary filmmaker who has traveled to 40 countries. She just went through a divorce and I worry about her. She's brilliant and fierce but I think she's questioning everything right now. Ask her about the documentary she made about fishermen in Kerala — that's when you'll see who she really is. And ask her about her parents' story. She's been circling that film for years.",
    relationshipLabel: "My best friend",
    inviteCode: "test-elena-priya",
    status: "accepted",
    curiosityThreads: [
      { domain: "experiences", thread: "The Kerala documentary — what happened there that hasn't happened since?" },
      { domain: "identity", thread: "Her parents expected a doctor. She chose film. How does that rebellion still shape her?" },
      { domain: "aspirations", thread: "There's a film about her parents' immigration story she hasn't made yet. What's holding her back?" },
      { domain: "struggles", thread: "Her friend says she's 'questioning everything' after the divorce. What questions is she actually asking?" },
    ],
  },
  {
    id: GIFT_IDS.elenaToLeo,
    fromPersonaId: PERSONA_IDS.elena,
    toPersonaId: PERSONA_IDS.leo,
    recipientEmail: leo.email,
    briefing: "Leo is my son and he's 24 and figuring out who he is apart from us. He's a software developer but his real passion is music — he produces electronic music under the name 'Tidepool.' He won't admit how talented he is. He's dating Jade and I've never seen him so happy. Ask him about what he's building — both the code and the music. He has his father's patience and my restlessness and I think that tension is the most interesting thing about him.",
    relationshipLabel: "My son",
    inviteCode: "test-elena-leo",
    status: "accepted",
    curiosityThreads: [
      { domain: "identity", thread: "He makes music under the name 'Tidepool.' What's in that name?" },
      { domain: "patterns", thread: "His mother sees his father's patience and her own restlessness in him. Does he feel that tension too?" },
      { domain: "aspirations", thread: "What is he building that feels most his own — the code or the music?" },
      { domain: "relationships", thread: "His mother says she's never seen him so happy since meeting Jade. What does Jade see in him that he can't see himself?" },
    ],
  },
  {
    id: GIFT_IDS.leoToJade,
    fromPersonaId: PERSONA_IDS.leo,
    toPersonaId: PERSONA_IDS.jade,
    recipientEmail: jade.email,
    briefing: "Jade is the most grounded person I've ever met. She's studying marine biology and she literally lights up when she talks about tide pools and kelp forests. She grew up on the Oregon coast and I think the ocean is part of her identity in a way she doesn't fully realize. She's quiet but when she talks about what matters to her, it's like poetry. Ask her about what she sees when she dives. Ask her about her grandmother who taught her to notice things.",
    relationshipLabel: "My girlfriend",
    inviteCode: "test-leo-jade",
    status: "accepted",
    curiosityThreads: [
      { domain: "identity", thread: "Her boyfriend says the ocean is part of her identity in a way she doesn't fully realize. What does the water mean to her?" },
      { domain: "relationships", thread: "Her grandmother taught her to notice things. What did she notice first?" },
      { domain: "joys", thread: "What does she see when she dives? Her partner says when she talks about it, it's like poetry." },
      { domain: "experiences", thread: "Growing up in a town of 700 people on the Oregon coast. What did that smallness give her?" },
    ],
  },
];

// ─── Connections ──────────────────────────────────────────────────────────────

export const TEST_CONNECTIONS: TestConnection[] = [
  {
    id: CONNECTION_IDS.elenaMarcus,
    giftId: GIFT_IDS.elenaToMarcus,
    userAId: PERSONA_IDS.elena,
    userBId: PERSONA_IDS.marcus,
    tierAtoB: "deep",
    tierBtoA: "personal",
  },
  {
    id: CONNECTION_IDS.elenaPriya,
    giftId: GIFT_IDS.elenaToPriya,
    userAId: PERSONA_IDS.elena,
    userBId: PERSONA_IDS.priya,
    tierAtoB: "personal",
    tierBtoA: "surface",
  },
  {
    id: CONNECTION_IDS.elenaLeo,
    giftId: GIFT_IDS.elenaToLeo,
    userAId: PERSONA_IDS.elena,
    userBId: PERSONA_IDS.leo,
    tierAtoB: "deep",
    tierBtoA: "personal",
  },
  {
    id: CONNECTION_IDS.leoJade,
    giftId: GIFT_IDS.leoToJade,
    userAId: PERSONA_IDS.leo,
    userBId: PERSONA_IDS.jade,
    tierAtoB: "personal",
    tierBtoA: "surface",
  },
];

// ─── Export ───────────────────────────────────────────────────────────────────

export const TEST_PERSONAS: Record<string, TestPersona> = {
  elena,
  marcus,
  priya,
  leo,
  jade,
};

export const PERSONA_LIST = [elena, marcus, priya, leo, jade] as const;
