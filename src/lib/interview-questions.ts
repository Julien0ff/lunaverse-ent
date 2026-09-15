export interface InterviewQuestion {
  id: string
  category: string
  question: string
  maxPoints: number
  isGraded: boolean
}

// Helper to shuffle arrays
function shuffle<T>(array: T[]): T[] {
  const newArr = [...array]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}

// ----------------------------------------------------
// BANQUES DE QUESTIONS : PROFESSEUR
// ----------------------------------------------------
const PROF_OBLIGATOIRES: InterviewQuestion[] = [
  { id: 'prof_obli_1', category: 'OBLIGATOIRE', question: 'Présente toi IRL et en RP', maxPoints: 1, isGraded: true },
  { id: 'prof_obli_2', category: 'OBLIGATOIRE', question: 'Disponibilités le week-end ? (Échelle 1 à 10, non noté)', maxPoints: 0, isGraded: false }
]

const PROF_GENERAL: InterviewQuestion[] = [
  { id: 'prof_gen_1', category: 'GÉNÉRAL', question: 'Qualités / Défauts', maxPoints: 2, isGraded: true },
  { id: 'prof_gen_2', category: 'GÉNÉRAL', question: 'Avez-vous déjà une expérience dans le rp (si oui, préciser) ?', maxPoints: 1, isGraded: true },
  { id: 'prof_gen_3', category: 'GÉNÉRAL', question: 'Qu’est ce qu’un adolescent ?', maxPoints: 2, isGraded: true }
]

const PROF_ROLEPLAY: InterviewQuestion[] = [
  { id: 'prof_rp_1', category: 'ROLEPLAY', question: 'Qu’est ce que le roleplay ?', maxPoints: 1, isGraded: true },
  { id: 'prof_rp_2', category: 'ROLEPLAY', question: 'Donne un exemple de HRP (dans le cadre du school-rp)', maxPoints: 2, isGraded: true },
  { id: 'prof_rp_3', category: 'ROLEPLAY', question: 'Décris-nous ton personnage, qui veux-tu incarner ?', maxPoints: 2, isGraded: true },
  { id: 'prof_rp_4', category: 'ROLEPLAY', question: 'A quoi correspond le rôle du professeur ? Cite 2 fonctions', maxPoints: 2, isGraded: true },
  { id: 'prof_rp_5', category: 'ROLEPLAY', question: 'Que recherchez-vous à apporter à notre établissement ?', maxPoints: 4, isGraded: true }
]

const PROF_PEDAGOGIE: InterviewQuestion[] = [
  { id: 'prof_ped_1', category: 'PÉDAGOGIE', question: 'Comment proposer un cours ludique, très attractif pour les élèves ?', maxPoints: 3, isGraded: true },
  { id: 'prof_ped_2', category: 'PÉDAGOGIE', question: 'Quelle serait ton approche si les élèves ne comprennent pas ton cours ?', maxPoints: 3, isGraded: true },
  { id: 'prof_ped_3', category: 'PÉDAGOGIE', question: 'Comment envisagez-vous d\'organiser vos cours de manière claire ? Exemples de ressources.', maxPoints: 4, isGraded: true },
  { id: 'prof_ped_4', category: 'PÉDAGOGIE', question: 'Aimeriez-vous proposer des clubs ou activités extrascolaires ?', maxPoints: 2, isGraded: true },
  { id: 'prof_ped_5', category: 'PÉDAGOGIE', question: 'Comment évalueriez-vous les élèves ?', maxPoints: 2, isGraded: true },
  { id: 'prof_ped_6', category: 'PÉDAGOGIE', question: 'Quels seront vos devoirs proposés ? Quel volume ?', maxPoints: 3, isGraded: true },
  { id: 'prof_ped_7', category: 'PÉDAGOGIE', question: 'Quelle est votre vision du RP scolaire idéal ?', maxPoints: 2, isGraded: true }
]

const PROF_PERSONNALITE: InterviewQuestion[] = [
  { id: 'prof_pers_1', category: 'PERSONNALITÉ', question: 'Pourquoi vous plutôt qu’un autre candidat ?', maxPoints: 4, isGraded: true },
  { id: 'prof_pers_2', category: 'PERSONNALITÉ', question: 'Comment captez-vous l’attention d’une classe en vocal ?', maxPoints: 2, isGraded: true },
  { id: 'prof_pers_3', category: 'PERSONNALITÉ', question: 'Sur 10, à quel point seras-tu strict avec les élèves ?', maxPoints: 1, isGraded: true },
  { id: 'prof_pers_4', category: 'PERSONNALITÉ', question: 'Quelle note te donnerais-tu en pédagogie sur 10 ? Pourquoi ?', maxPoints: 2, isGraded: true },
  { id: 'prof_pers_5', category: 'PERSONNALITÉ', question: 'Sur 10, à quel point seras-tu patient ?', maxPoints: 1, isGraded: true }
]

const PROF_SITUATION: InterviewQuestion[] = [
  { id: 'prof_sit_1', category: 'MISES EN SITUATION', question: 'Élève en retard à plusieurs reprises, l\'autorisez-vous à entrer ?', maxPoints: 2, isGraded: true },
  { id: 'prof_sit_2', category: 'MISES EN SITUATION', question: 'Élève qui n\'écoute rien et bavarde malgré avertissement. Que faire ?', maxPoints: 2, isGraded: true },
  { id: 'prof_sit_3', category: 'MISES EN SITUATION', question: 'Les élèves sont fatigués, inactifs, déconcentrés. Que faites-vous ?', maxPoints: 2, isGraded: true },
  { id: 'prof_sit_4', category: 'MISES EN SITUATION', question: 'Un élève crée un départ d’incendie avec un briquet. Que faites-vous ?', maxPoints: 2, isGraded: true },
  { id: 'prof_sit_5', category: 'MISES EN SITUATION', question: 'Deux élèves se disputent en plein cours, comment réagissez-vous ?', maxPoints: 2, isGraded: true },
  { id: 'prof_sit_6', category: 'MISES EN SITUATION', question: 'Vous avez un imprévu, comment gérez-vous votre absence ?', maxPoints: 2, isGraded: true }
]


// ----------------------------------------------------
// BANQUES DE QUESTIONS : AED
// ----------------------------------------------------
const AED_OBLIGATOIRES: InterviewQuestion[] = [
  { id: 'aed_obli_1', category: 'INTRODUCTION', question: 'Présentez-vous brièvement.', maxPoints: 2, isGraded: true },
  { id: 'aed_obli_2', category: 'INTRODUCTION', question: 'Quelles sont vos disponibilités ?', maxPoints: 0, isGraded: false }
]

const AED_GENERAL: InterviewQuestion[] = [
  { id: 'aed_gen_1', category: 'GÉNÉRAL', question: 'Quels sont selon vous vos qualités et vos défauts ?', maxPoints: 2, isGraded: true },
  { id: 'aed_gen_2', category: 'GÉNÉRAL', question: 'Qu\'est-ce qu\'un adolescent pour vous ?', maxPoints: 2, isGraded: true }
]

const AED_ROLE: InterviewQuestion[] = [
  { id: 'aed_role_1', category: 'RÔLE & POSTURE', question: 'Quelles qualités faudrait-il avoir pour devenir AED ?', maxPoints: 2, isGraded: true },
  { id: 'aed_role_2', category: 'RÔLE & POSTURE', question: 'Que pourriez-vous apporter au service de vie scolaire ?', maxPoints: 2, isGraded: true },
  { id: 'aed_role_3', category: 'RÔLE & POSTURE', question: 'Donnez 3 fonctions d\'un Surveillant.', maxPoints: 2, isGraded: true }
]

const AED_DISCIPLINE: InterviewQuestion[] = [
  { id: 'aed_disc_1', category: 'DISCIPLINE', question: 'Qui est votre supérieur hiérarchique direct ?', maxPoints: 2, isGraded: true },
  { id: 'aed_disc_2', category: 'DISCIPLINE', question: 'À quoi sert le règlement intérieur et comment l\'utiliser ?', maxPoints: 2, isGraded: true },
  { id: 'aed_disc_3', category: 'DISCIPLINE', question: 'Quelle est la différence entre punition et sanction ?', maxPoints: 2, isGraded: true }
]

const AED_INSTITUTION: InterviewQuestion[] = [
  { id: 'aed_inst_1', category: 'INSTITUTION', question: 'Qu\'est-ce que le Conseil de Discipline ?', maxPoints: 2, isGraded: true },
  { id: 'aed_inst_2', category: 'INSTITUTION', question: 'Qu\'est-ce que la laïcité à l\'école ?', maxPoints: 2, isGraded: true },
  { id: 'aed_inst_3', category: 'INSTITUTION', question: 'C\'est quoi le PPMS ?', maxPoints: 2, isGraded: true },
  { id: 'aed_inst_4', category: 'INSTITUTION', question: 'Sur 10, à quel point seras-tu strict ?', maxPoints: 1, isGraded: true },
  { id: 'aed_inst_5', category: 'INSTITUTION', question: 'Sur 10, à quel point seras-tu patient ?', maxPoints: 1, isGraded: true }
]

const AED_CULTURERP: InterviewQuestion[] = [
  { id: 'aed_cult_1', category: 'CULTURE RP', question: 'Qu’est ce que le roleplay ?', maxPoints: 1, isGraded: true },
  { id: 'aed_cult_2', category: 'CULTURE RP', question: 'Décris-nous ton personnage, seras tu sévère ?', maxPoints: 2, isGraded: true },
  { id: 'aed_cult_3', category: 'CULTURE RP', question: 'Donne un exemple de HRP.', maxPoints: 2, isGraded: true },
  { id: 'aed_cult_4', category: 'CULTURE RP', question: 'Quelle est votre vision du RP scolaire idéal ?', maxPoints: 2, isGraded: true }
]

const AED_SITUATION: InterviewQuestion[] = [
  { id: 'aed_sit_1', category: 'MISES EN SITUATION', question: 'Un professeur est souvent en retard. Les élèves trouvent ça injuste. Que dites-vous ?', maxPoints: 2, isGraded: true },
  { id: 'aed_sit_2', category: 'MISES EN SITUATION', question: 'Vous faites l\'objet de remarques inappropriées d\'élèves. Comment réagissez-vous ?', maxPoints: 2, isGraded: true },
  { id: 'aed_sit_3', category: 'MISES EN SITUATION', question: 'En permanence, un élève refuse de travailler et vous insulte. Que faites-vous ?', maxPoints: 2, isGraded: true },
  { id: 'aed_sit_4', category: 'MISES EN SITUATION', question: 'Deux élèves se disputent violemment dans la cour. Que faites-vous ?', maxPoints: 2, isGraded: true },
  { id: 'aed_sit_5', category: 'MISES EN SITUATION', question: 'Un élève utilise son téléphone malgré l’interdiction.', maxPoints: 2, isGraded: true },
  { id: 'aed_sit_6', category: 'MISES EN SITUATION', question: 'Un élève semble triste, isolé. Que faites-vous ?', maxPoints: 2, isGraded: true },
  { id: 'aed_sit_7', category: 'MISES EN SITUATION', question: 'Si un élève vous tutoie, comment réagissez-vous ?', maxPoints: 2, isGraded: true }
]


// ----------------------------------------------------
// FONCTION PRINCIPALE DE GÉNÉRATION
// ----------------------------------------------------
export function generateInterviewQuestions(role: string): InterviewQuestion[] {
  let questions: InterviewQuestion[] = []

  if (role === 'Professeur') {
    // 2 obligatoires
    questions.push(...PROF_OBLIGATOIRES)
    
    // 1 de chaque catégorie
    const shufGen = shuffle(PROF_GENERAL)
    const shufRp = shuffle(PROF_ROLEPLAY)
    const shufPed = shuffle(PROF_PEDAGOGIE)
    const shufPers = shuffle(PROF_PERSONNALITE)

    questions.push(shufGen[0])
    questions.push(shufRp[0])
    questions.push(shufPed[0])
    questions.push(shufPers[0])

    // 2 aléatoires parmi les restantes
    const remaining = [
      ...shufGen.slice(1),
      ...shufRp.slice(1),
      ...shufPed.slice(1),
      ...shufPers.slice(1)
    ]
    const shufRemaining = shuffle(remaining)
    questions.push(shufRemaining[0])
    questions.push(shufRemaining[1])

    // 2 Mises en situation
    const shufSit = shuffle(PROF_SITUATION)
    questions.push(shufSit[0])
    questions.push(shufSit[1])

  } else if (role === 'AED' || role === 'Surveillant') {
    // 2 obligatoires
    questions.push(...AED_OBLIGATOIRES)

    // 1 de chaque
    questions.push(shuffle(AED_GENERAL)[0])
    questions.push(shuffle(AED_ROLE)[0])
    questions.push(shuffle(AED_DISCIPLINE)[0])
    questions.push(shuffle(AED_INSTITUTION)[0])
    questions.push(shuffle(AED_CULTURERP)[0])

    // 3 Mises en situation
    const shufSit = shuffle(AED_SITUATION)
    questions.push(shufSit[0], shufSit[1], shufSit[2])

  } else {
    // Psy, Infirmier, etc.
    // 0 question générée.
    return []
  }

  // Renuméroter et nettoyer l'ID pour le frontend
  return questions.map((q, i) => ({
    ...q,
    id: `q_${i}_${Date.now()}` // Ensures uniqueness if needed by React map
  }))
}
