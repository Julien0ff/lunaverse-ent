import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-server'

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        if (!await requireAdmin(supabase, admin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { targetRole } = await request.json()
        const groqKey = process.env.GROQ_API_KEY
        if (!groqKey) return NextResponse.json({ error: 'La clé API Groq n\'est pas configurée.' }, { status: 500 })

        const prompt = `Génère une idée d'objet, de service, ou de nourriture à vendre dans la boutique d'un serveur Roleplay Scolaire pour le rôle cible suivant : "${targetRole || 'Élève'}".
Si le rôle est 'Proviseur' ou 'Admin', propose par exemple des fournitures de bureau premium, un café de luxe, un stylo en or, ou un badge.
Si le rôle est 'Élève', propose de la nourriture de cantine, des antisèches (rp), un sac à dos stylé, une boisson énergisante, etc.
Tu dois répondre UNIQUEMENT par un objet JSON valide avec ce format exact, sans aucun autre texte (pas de markdown \`\`\`json) :
{
  "name": "Nom de l'objet (max 30 chars)",
  "description": "Description RP amusante (max 100 chars)",
  "price": prix_entier_en_euros,
  "type": "item" ou "food" ou "role" (choisis judicieusement)
}`

        const models = [
            'gemma2-9b-it',
            'llama-3.2-3b-preview',
            'llama-3.1-70b-versatile',
            'gemma-7b-it',
            'deepseek-r1-distill-llama-70b',
            'deepseek-r1-distill-qwen-32b',
            'mixtral-8x7b-32768'
        ]

        let allErrors = []
        for (const model of models) {
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
                        response_format: { type: 'json_object' },
                        temperature: 0.8
                    })
                })

                if (!res.ok) {
                    const errTxt = await res.text()
                    allErrors.push(`[${model} API Error] ` + errTxt)
                    continue;
                }
                const data = await res.json()
                const text = data.choices[0].message.content
                const match = text.match(/\{[\s\S]*\}/)
                if (match) {
                    const obj = JSON.parse(match[0])
                    if (obj.name && obj.price !== undefined) {
                        return NextResponse.json(obj)
                    } else {
                        allErrors.push(`[${model} Parse Error] Missing name or price in: ${match[0]}`)
                    }
                } else {
                    allErrors.push(`[${model} Parse Error] No JSON match in: ${text}`)
                }
            } catch (err: any) {
                allErrors.push(`[${model} Catch Error] ` + err.message)
            }
        }
        
        throw new Error('Échec tous modèles : ' + JSON.stringify(allErrors))
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
