import type { CorpusItem } from "../types";
import { item } from "./corpusUtil";

// English corpus — original curated text, authored for TypingArena (no runtime
// generation, no machine translation). Source tag tracks the corpus release.

const SRC = "original-en-v2";

export const ENGLISH_CORPUS: CorpusItem[] = [
  // --- Sprint: common words / natural prose ---------------------------------
  item("en-sprint-001", "en", "sprint", "easy", ["common-words"], SRC,
    "the quick brown fox jumps over the lazy dog while the morning sun rises over the quiet town and people begin their daily routines"),
  item("en-sprint-002", "en", "sprint", "easy", ["motivational"], SRC,
    "practice makes progress and consistent effort builds lasting skill in every challenge we choose to pursue with patience"),
  item("en-sprint-003", "en", "sprint", "medium", ["tech"], SRC,
    "technology transforms how we communicate and typing remains a fundamental skill for productivity across many professions today"),
  item("en-sprint-004", "en", "sprint", "easy", ["daily-life"], SRC,
    "she poured a fresh cup of coffee and opened the window to let the cool morning air drift through the kitchen"),
  item("en-sprint-005", "en", "sprint", "medium", ["work"], SRC,
    "the team agreed to review the proposal again on thursday because two sections still needed clearer numbers and simpler wording"),
  item("en-sprint-006", "en", "sprint", "easy", ["nature"], SRC,
    "rain fell softly on the roof all afternoon and the garden drank every drop before the clouds finally moved east"),
  item("en-sprint-007", "en", "sprint", "medium", ["travel"], SRC,
    "our train leaves at seven fifteen so we should reach the station early grab coffee and find the platform without rushing"),
  item("en-sprint-008", "en", "sprint", "medium", ["education"], SRC,
    "students who practice typing for ten focused minutes each day often double their speed within a single school semester"),
  item("en-sprint-009", "en", "sprint", "easy", ["food"], SRC,
    "the recipe calls for three eggs one cup of flour and a generous handful of grated cheese mixed slowly into the batter"),
  item("en-sprint-010", "en", "sprint", "medium", ["business"], SRC,
    "clear writing saves time because readers understand the message on the first pass and do not need to ask follow up questions"),
  item("en-sprint-011", "en", "sprint", "hard", ["abstract"], SRC,
    "discipline is choosing between what you want now and what you want most and small daily choices quietly shape large outcomes"),
  item("en-sprint-012", "en", "sprint", "easy", ["city"], SRC,
    "buses rumbled past the old bookshop where a sleepy cat watched the world from behind a dusty window full of paperbacks"),
  item("en-sprint-013", "en", "sprint", "medium", ["sports"], SRC,
    "the goalkeeper trained twice as hard after that match and by spring nobody could slip a ball past him from close range"),
  item("en-sprint-014", "en", "sprint", "medium", ["science"], SRC,
    "careful measurement matters more than clever theory because data collected badly will mislead even the smartest researcher"),
  item("en-sprint-015", "en", "sprint", "easy", ["home"], SRC,
    "he fixed the squeaky door oiled the hinges and finally sat down to read letters that had waited weeks for a reply"),
  item("en-sprint-016", "en", "sprint", "hard", ["abstract"], SRC,
    "attention is the rarest form of generosity and giving it fully to one task at a time is a quiet competitive advantage"),

  // --- Copy Pro: punctuation + capitalization + realistic business ----------
  item("en-copypro-001", "en", "copy-pro", "medium", ["punctuation", "symbols"], SRC,
    "Hello, World! This is a Copy Pro exercise: numbers (42, 3.14), symbols @#$, and Capitalized Words. Can you keep 100% accuracy?"),
  item("en-copypro-002", "en", "copy-pro", "hard", ["data-entry", "address", "date"], SRC,
    "On 12/31/2025, Order #A-4829 was shipped to 742 Evergreen Terrace, Springfield, IL 62704. Total: $1,249.00 (incl. tax)."),
  item("en-copypro-003", "en", "copy-pro", "medium", ["office"], SRC,
    "Dear Ms. Alvarez, Thank you for your prompt reply. The signed contract is attached; please confirm receipt by Friday, June 6."),
  item("en-copypro-004", "en", "copy-pro", "medium", ["proper-nouns"], SRC,
    "The conference in Kuala Lumpur runs from March 3-7; speakers include Dr. Chen, Prof. Okafor, and Ms. Wijaya of Bandung."),
  item("en-copypro-005", "en", "copy-pro", "hard", ["mixed-case"], SRC,
    "\"Ship it Friday,\" said the lead engineer, \"but ONLY after QA signs off on build 2.4.1 — no exceptions this sprint.\""),
  item("en-copypro-006", "en", "copy-pro", "medium", ["email"], SRC,
    "RE: Invoice #2026-114 — payment of $3,480.00 was received on Feb. 14; your account balance is now $0.00. Regards, Finance."),
  item("en-copypro-007", "en", "copy-pro", "hard", ["complex"], SRC,
    "The researcher's hypothesis — though unproven — suggested that deterministic adaptation could feel personalized without any generative inference at runtime."),
  item("en-copypro-008", "en", "copy-pro", "medium", ["schedule"], SRC,
    "Stand-up moves to 8:45 a.m. starting Monday; bring blockers, estimates, and one update per person — keep it under seven minutes."),

  // --- Numbers & Data --------------------------------------------------------
  item("en-numbers-001", "en", "numbers", "hard", ["numbers"], SRC,
    "Order IDs: 90421, 77304, 11289 | Phones: +1-415-555-0132, +1-212-555-0198 | Amounts: 42.50, 1,299.00, 0.99"),
  item("en-numbers-002", "en", "numbers", "medium", ["dates"], SRC,
    "Deadlines: Jan 15, Feb 28, Mar 31, Jun 30 | Review calls: 10:30, 13:00, 16:45 | Quarters: Q1-Q4"),
  item("en-numbers-003", "en", "numbers", "hard", ["codes"], SRC,
    "SKU XR-770-QTY 12 @ $19.50 = $234.00; SKU AB-112-QTY 3 @ $8.25 = $24.75; SHIPPING $6.80; TOTAL $265.55"),
  item("en-numbers-004", "en", "numbers", "medium", ["inventory"], SRC,
    "Warehouse B holds 1,204 cartons on aisle 7, shelf C3; 96 units are reserved and 38 were returned last Tuesday."),
  item("en-numbers-005", "en", "numbers", "hard", ["records"], SRC,
    "Patient 04-8812: temp 36.8C, BP 118/76, dose 2 x 250mg every 8h; next checkup 09/14 at Room 12B, Dr. Osei."),
  item("en-numbers-006", "en", "numbers", "medium", ["finance"], SRC,
    "Budget FY2026: marketing $120,000 (+8%), engineering $450,500 (-2%), support $88,750 (=), travel cap $14,200."),

  // --- Punctuation precision --------------------------------------------------
  item("en-punct-001", "en", "punctuation", "medium", ["dialogue", "quotes"], SRC,
    "\"Don't worry,\" she said, \"it's not that complicated — just focus on accuracy, then speed will follow naturally.\""),
  item("en-punct-002", "en", "punctuation", "medium", ["dialogue"], SRC,
    "\"Wait,\" he called out, \"did anyone remember the tickets, the passports, or — more importantly — the hotel address?\""),
  item("en-punct-003", "en", "punctuation", "hard", ["apostrophes"], SRC,
    "It's the editors' job to catch what writers' eyes miss: misplaced commas, stray apostrophes', and dashes used—incorrectly."),
  item("en-punct-004", "en", "punctuation", "medium", ["lists"], SRC,
    "Pack the essentials: a flashlight; fresh batteries; a paper map (yes, really); rope; and — most crucially — spare water."),
  item("en-punct-005", "en", "punctuation", "hard", ["dialogue"], SRC,
    "\"You typed 'their' instead of 'there' again,\" the tutor noted gently; \"slow down at homophones and you'll fix it.\""),
  item("en-punct-006", "en", "punctuation", "medium", ["questions"], SRC,
    "Who benefits when instructions are vague? Nobody. So ask: who, what, when, where, why — then write it down clearly!"),
];

export const ENGLISH_SPRINT_POOL = ENGLISH_CORPUS.filter((c) => c.mode === "sprint");
