export interface InterviewQuestion {
    id: string
    category: string
    question: string
    maxPoints: number
    isGraded: boolean
}

export function generateQuestionsForRole(role: string): InterviewQuestion[] {
    const questions: InterviewQuestion[] = []
    
    // Intro questions (Always included)
    questions.push({
        id: 'intro_1',
        category: 'Introduction',
        question: 'Présentez-vous brièvement IRL et RP.',
        maxPoints: 1,
        isGraded: true
    })
    questions.push({
        id: 'intro_2',
        category: 'Introduction',
        question: 'Quelles sont vos disponibilités le week-end ?',
        maxPoints: 0,
        isGraded: false
    })

    if (role.toLowerCase().includes('prof')) {
        // --- PROFESSOR ---
        // Personality / Pedagogy (Pick to reach 9 points)
        const profPedagogy = [
            { id: 'prof_ped_1', question: 'Quelles sont les qualités et défauts de votre personnage ?', maxPoints: 2 },
            { id: 'prof_ped_2', question: 'Comment proposer un cours ludique très attractif ?', maxPoints: 3 },
            { id: 'prof_ped_3', question: 'Pourquoi vous et pas un autre candidat ?', maxPoints: 4 },
            { id: 'prof_ped_4', question: 'Qu\'est-ce que le roleplay selon vous ?', maxPoints: 1 },
            { id: 'prof_ped_5', question: 'Sur une échelle de 1 à 10, à quel point êtes-vous strict avec vos élèves ?', maxPoints: 1 },
            { id: 'prof_ped_6', question: 'Quelle est votre vision de l\'autorité en classe ?', maxPoints: 2 },
            { id: 'prof_ped_7', question: 'Comment intégrez-vous les élèves en difficulté dans votre cours ?', maxPoints: 3 },
            { id: 'prof_ped_8', question: 'Que pensez-vous du travail en groupe ?', maxPoints: 2 }
        ].sort(() => 0.5 - Math.random())

        let pedPoints = 0
        for (const q of profPedagogy) {
            if (pedPoints + q.maxPoints <= 9) {
                questions.push({ ...q, category: 'Pédagogie & Personnalité', isGraded: true })
                pedPoints += q.maxPoints
            }
        }
        // If we didn't reach exactly 9, pad with generic 1pt questions (hacky but works)
        while (pedPoints < 9) {
            questions.push({ id: `prof_pad_${pedPoints}`, category: 'Pédagogie', question: 'Question complémentaire sur votre méthode de travail.', maxPoints: 1, isGraded: true })
            pedPoints += 1
        }

        // Situations (Pick to reach 10 points)
        const profSituations = [
            { id: 'prof_sit_1', question: 'Mise en situation : Un élève arrive souvent en retard à votre cours.', maxPoints: 2 },
            { id: 'prof_sit_2', question: 'Mise en situation : Un élève est très bavard, malgré vos avertissements.', maxPoints: 2 },
            { id: 'prof_sit_3', question: 'Mise en situation : Un élève refuse catégoriquement de faire le travail demandé.', maxPoints: 2 },
            { id: 'prof_sit_4', question: 'Mise en situation : Deux élèves s\'insultent violemment pendant votre cours.', maxPoints: 2 },
            { id: 'prof_sit_5', question: 'Mise en situation : Un élève utilise son téléphone sous la table.', maxPoints: 2 },
            { id: 'prof_sit_6', question: 'Mise en situation : Un parent d\'élève conteste l\'une de vos notes avec agressivité.', maxPoints: 3 },
            { id: 'prof_sit_7', question: 'Mise en situation : Vous surprenez un élève en train de tricher lors d\'un examen.', maxPoints: 3 }
        ].sort(() => 0.5 - Math.random())

        let sitPoints = 0
        for (const q of profSituations) {
            if (sitPoints + q.maxPoints <= 10) {
                questions.push({ ...q, category: 'Mises en situation', isGraded: true })
                sitPoints += q.maxPoints
            }
        }
        while (sitPoints < 10) {
            questions.push({ id: `prof_sit_pad_${sitPoints}`, category: 'Mises en situation', question: 'Mise en situation mineure : Élève sans son matériel.', maxPoints: 1, isGraded: true })
            sitPoints += 1
        }

    } else if (role.toLowerCase().includes('aed') || role.toLowerCase().includes('surveillant')) {
        // --- AED ---
        // Personality / Knowledge (Pick to reach 11 points)
        const aedKnowledge = [
            { id: 'aed_kn_1', question: 'De manière générale, qu\'est-ce qu\'un adolescent pour vous ?', maxPoints: 2 },
            { id: 'aed_kn_2', question: 'Rôle et posture : Que pensez-vous apporter au service de la vie scolaire ?', maxPoints: 2 },
            { id: 'aed_kn_3', question: 'La hiérarchie : Qui est votre supérieur hiérarchique direct ? (Attendu: CPE)', maxPoints: 2 },
            { id: 'aed_kn_4', question: 'L\'établissement : Qu\'est-ce que la laïcité à l\'école ?', maxPoints: 2 },
            { id: 'aed_kn_5', question: 'Culture RP : Décrivez votre personnage, serez-vous sévère ?', maxPoints: 2 },
            { id: 'aed_kn_6', question: 'Pourquoi postuler en tant qu\'AED spécifiquement ?', maxPoints: 1 },
            { id: 'aed_kn_7', question: 'Comment réagissez-vous face à la provocation verbale ?', maxPoints: 2 },
            { id: 'aed_kn_8', question: 'Quel est pour vous le rôle préventif d\'un AED ?', maxPoints: 2 }
        ].sort(() => 0.5 - Math.random())

        let knPoints = 0
        for (const q of aedKnowledge) {
            if (knPoints + q.maxPoints <= 11) {
                questions.push({ ...q, category: 'Connaissances & Personnalité', isGraded: true })
                knPoints += q.maxPoints
            }
        }
        while (knPoints < 11) {
            questions.push({ id: `aed_pad_${knPoints}`, category: 'Connaissances', question: 'Connaissance du règlement intérieur (question libre).', maxPoints: 1, isGraded: true })
            knPoints += 1
        }

        // Situations (Pick to reach 8 points)
        const aedSituations = [
            { id: 'aed_sit_1', question: 'Mise en situation : Un élève utilise son téléphone de manière provocante dans le couloir.', maxPoints: 2 },
            { id: 'aed_sit_2', question: 'Mise en situation : Deux élèves se battent violemment dans la cour.', maxPoints: 2 },
            { id: 'aed_sit_3', question: 'Mise en situation : Un professeur arrive souvent en retard, les élèves trouvent ça injuste et vous le disent.', maxPoints: 2 },
            { id: 'aed_sit_4', question: 'Mise en situation : Un élève fume ostensiblement devant l\'entrée du lycée.', maxPoints: 2 },
            { id: 'aed_sit_5', question: 'Mise en situation : Un élève fait un malaise dans les couloirs.', maxPoints: 2 },
            { id: 'aed_sit_6', question: 'Mise en situation : Un élève refuse de vous donner son carnet de correspondance.', maxPoints: 2 }
        ].sort(() => 0.5 - Math.random())

        let sitPoints = 0
        for (const q of aedSituations) {
            if (sitPoints + q.maxPoints <= 8) {
                questions.push({ ...q, category: 'Mises en situation', isGraded: true })
                sitPoints += q.maxPoints
            }
        }
        while (sitPoints < 8) {
            questions.push({ id: `aed_sit_pad_${sitPoints}`, category: 'Mises en situation', question: 'Mise en situation mineure (bruit au CDI).', maxPoints: 1, isGraded: true })
            sitPoints += 1
        }
    } else {
        // Other roles (Infirmier, Psy) have no pre-generated questions.
        // The admin will just fill the global observation.
    }

    return questions
}
