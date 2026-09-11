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
    
    const prompt = `Génère un menu de cantine scolaire française (collège/lycée) équilibré, varié et appétissant.
Le menu doit inclure :
- Une entrée (starter)
- Un plat principal (main)
- Un plat secondaire ou accompagnement (side)
- Un dessert (dessert)
- Une boisson (drink)

Renvoie UNIQUEMENT un objet JSON valide avec les clés suivantes en anglais, et les valeurs en français. Pas de texte avant ou après.
Exemple:
{
  "starter": "Salade piémontaise",
  "main": "Filet de poisson au citron",
  "side": "Riz aux petits légumes",
  "dessert": "Tartelette aux fraises",
  "drink": "Jus de pomme artisanal"
}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Groq API Error:', err)
      throw new Error(`Erreur Groq: ${err}`)
    }

    const data = await res.json()
    const responseText = data.choices[0].message.content
    const menu = JSON.parse(responseText)

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
