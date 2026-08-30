import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = createSupabaseServer()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { image_url } = await request.json()
        if (!image_url) {
            return NextResponse.json({ error: 'Missing image_url' }, { status: 400 })
        }

        const profileId = session.user.id

        const { data: inserted, error } = await supabase
            .from('pronote_requests')
            .insert({ profile_id: profileId, image_url })
            .select()
            .single()

        if (error) throw error

        // Attempt to notify discord admins if a channel is configured
        try {
            const { data: adminChanData } = await supabase.from('server_settings').select('value').eq('key', 'pronote_admin_id').maybeSingle()
            const adminChannelId = adminChanData?.value
            if (adminChannelId && process.env.DISCORD_BOT_TOKEN) {
                const { data: profileData } = await supabase.from('profiles').select('username, discord_id').eq('id', profileId).single()
                
                const embed = {
                    title: '🚨 Nouvelle demande de liaison Pronote',
                    color: 0x5865F2,
                    description: `**Utilisateur:** ${profileData?.username} (<@${profileData?.discord_id}>)\n**Action:** Allez sur l'ENT dans l'onglet Administration > Demandes Pronote pour valider ou refuser.`,
                    image: { url: image_url },
                    timestamp: new Date().toISOString()
                }

                await fetch(`https://discord.com/api/v10/channels/${adminChannelId}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ embeds: [embed] })
                })
            }
        } catch (e) {
            console.error('Failed to notify Discord about Pronote request:', e)
        }

        return NextResponse.json({ success: true, data: inserted })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
