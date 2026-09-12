import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Auth check
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) {
      return NextResponse.json({ error: 'La clé API Groq n\'est pas configurée.' }, { status: 500 })
    }
    
    const salt = Math.random().toString(36).substring(7)
    const prompt = `Génère un menu de cantine scolaire française (collège/lycée) équilibré, varié et appétissant.
IMPORTANT : Tu DOIS proposer un menu complètement inédit, original et différent des précédents (Graine aléatoire : ${salt}).
Choisis aléatoirement des thèmes différents (ex: végétarien, cuisine du monde, classique, régional, etc.).
Le menu doit inclure :
- Une entrée (starter)
- Un plat principal (main)
- Un plat secondaire ou accompagnement (side)
- Un dessert (dessert)
- Une boisson (drink)

Renvoie UNIQUEMENT un objet JSON valide avec les clés suivantes en anglais, et les valeurs en français. Pas de texte avant ou après.
Exemple de structure:
{
  "starter": "Salade piémontaise",
  "main": "Filet de poisson au citron",
  "side": "Riz aux petits légumes",
  "dessert": "Tartelette aux fraises",
  "drink": "Jus de pomme artisanal"
}`

    let modelsToTry = [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile'
    ]

    try {
      const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${groqKey}` }
      })
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json()
        const available = modelsData.data
          .map((m: any) => m.id)
          .filter((id: string) => !id.includes('whisper') && !id.includes('guard'))
        if (available.length > 0) {
          modelsToTry = available.slice(0, 4) // On garde les 4 premiers modèles valides
        }
      }
    } catch (e) {
      console.warn("Could not fetch models dynamically", e)
    }

    let responseText = null
    let allErrors = []

    for (const model of modelsToTry) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7
          })
        })

        if (!res.ok) {
          const err = await res.text()
          allErrors.push({ model, error: err })
          console.error(`Groq API Error on model ${model}:`, err)
          continue // Try next model
        }

        const data = await res.json()
        responseText = data.choices[0].message.content
        break // Success!
      } catch (err: any) {
        allErrors.push({ model, error: err.message })
        continue
      }
    }

    if (!responseText) {
      throw new Error(`Erreur Groq (tous les modèles ont échoué): ${JSON.stringify(allErrors)}`)
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("La réponse de l'IA n'est pas un JSON valide.")
    }
    const menu = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      starter: menu.starter || '',
      main: menu.main || '',
      side: menu.side || '',
      dessert: menu.dessert || '',
      drink: menu.drink || ''
    })

  } catch (err: any) {
    console.error("AI Cantine Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
