import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'

async function checkSuperAdmin(userId: string) {
    const admin = createSupabaseAdmin()
    const { data: profile } = await admin.from('profiles').select('discord_id').eq('id', userId).single()
    if (!profile) return false
    
    // Check against comma-separated ADMIN_DISCORD_IDS
    const adminIds = (process.env.ADMIN_DISCORD_IDS || '').split(',').map(id => id.trim())
    return adminIds.includes(profile.discord_id)
}

export async function GET() {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        
        const { data } = await admin.from('roles').select('*').order('name')
        return NextResponse.json({ roles: data || [] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        
        const isSuperAdmin = await checkSuperAdmin(user.id)
        if (!isSuperAdmin) {
            return NextResponse.json({ error: 'Seul le Super Admin (vous) peut modifier les rôles.' }, { status: 403 })
        }

        const body = await request.json()
        const { id, can_connect, salary_amount, pocket_money } = body

        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

        const { error } = await admin
            .from('roles')
            .update({
                can_connect,
                salary_amount: Number(salary_amount || 0),
                pocket_money: Number(pocket_money || 0)
            })
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        
        const isSuperAdmin = await checkSuperAdmin(user.id)
        if (!isSuperAdmin) {
            return NextResponse.json({ error: 'Seul le Super Admin peut créer des rôles.' }, { status: 403 })
        }

        const body = await request.json()
        const { name, discord_role_id, color } = body

        if (!name || !discord_role_id) {
            return NextResponse.json({ error: 'Nom et ID Discord requis' }, { status: 400 })
        }

        const { data, error } = await admin
            .from('roles')
            .insert([{ name, discord_role_id, color: color || '#FFFFFF', can_connect: false }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ role: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

