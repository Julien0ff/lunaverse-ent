import { createSupabaseServer } from '@/lib/supabase-server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const user = await requireAdmin(supabase, admin)
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { data: users, error } = await admin
          .from('profiles')
          .select(`
            *,
            user_roles (
              roles (
                id,
                name
              )
            )
          `)
          .order('created_at', { ascending: false })
          
        if (error) throw error

        const formattedUsers = (users || []).map(u => {
          const roles = u.user_roles?.map((ur: any) => ur.roles).filter(Boolean) || []
          // Remove user_roles from the object to avoid cluttering, attach roles instead
          delete u.user_roles
          return { ...u, roles }
        })

        return NextResponse.json({ users: formattedUsers })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PATCH: update any profile fields (pronote_id, health, food, water, sleep, alcohol, etc.)
export async function PATCH(request: NextRequest) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const user = await requireAdmin(supabase, admin)
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const { userId, ...updates } = await request.json()
        if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

        // Whitelist updatable fields
        const ALLOWED = ['pronote_id', 'health', 'hunger', 'thirst', 'fatigue', 'hygiene', 'alcohol', 'balance', 'first_connection', 'nickname_rp']
        const payload: Record<string, any> = {}
        for (const key of ALLOWED) {
            if (key in updates) {
                const val = updates[key]
                // Clamp stat values 0-100
                if (['health', 'hunger', 'thirst', 'fatigue', 'hygiene', 'alcohol'].includes(key)) {
                    payload[key] = Math.max(0, Math.min(100, Number(val)))
                } else {
                    payload[key] = val ?? null
                }
            }
        }

        if (Object.keys(payload).length === 0)
            return NextResponse.json({ error: 'Aucun champ valide' }, { status: 400 })

        const { error } = await admin.from('profiles').update(payload).eq('id', userId)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE: Delete a user and their auth account
export async function DELETE(request: NextRequest) {
    try {
        const supabase = createSupabaseServer()
        const admin = createSupabaseAdmin()
        const user = await requireAdmin(supabase, admin)
        if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

        const url = new URL(request.url)
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })

        // Manually delete dependent records to avoid FK constraint errors if cascade is not set
        const tablesToClearByUserId = [
            'user_roles', 'posts', 'comments', 'post_likes', 'items_inventory',
            'absences', 'inscriptions', 'properties'
        ]
        
        for (const table of tablesToClearByUserId) {
            try { await admin.from(table).delete().eq('user_id', id) } catch (e) {}
        }

        try { await admin.from('friends').delete().or(`user_id.eq.${id},friend_id.eq.${id}`) } catch (e) {}
        try { await admin.from('messages').delete().or(`sender_id.eq.${id},receiver_id.eq.${id}`) } catch (e) {}
        try { await admin.from('bank_transactions').delete().or(`sender_id.eq.${id},receiver_id.eq.${id}`) } catch (e) {}
        
        // Delete from auth.users (requires service role key)
        const { error: authError } = await admin.auth.admin.deleteUser(id)
        
        if (authError) {
          console.error("Auth delete error:", authError)
          // If auth deletion fails (maybe due to lack of service role key), try deleting just the profile
          const { error: profileError } = await admin.from('profiles').delete().eq('id', id)
          if (profileError) throw profileError
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error("DELETE user error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
