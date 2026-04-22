import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/cron/salary
 * Distributes weekly salaries to all eligible profiles.
 * Protected by CRON_SECRET header.
 * Can be called by:
 * - Vercel Cron Jobs (every Monday at midnight)
 * - Manual trigger from admin panel
 * - External cron service
 */
export async function POST(request: NextRequest) {
    // Security check — only allow if secret header matches
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('x-cron-secret')

    if (cronSecret && authHeader !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const admin = createSupabaseAdmin()
        const now = new Date()
        const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 3600 * 1000)

        // Find all profiles that haven't received salary in 6+ days
        const { data: profiles } = await admin
            .from('profiles')
            .select('id, username, balance, last_salary')
            .or(`last_salary.is.null,last_salary.lt.${sixDaysAgo.toISOString()}`)

        const results: { username: string; amount: number; status: string }[] = []

        for (const profile of (profiles || [])) {
            const { data: userRoles } = await admin
                .from('user_roles')
                .select('role:roles(salary_amount, pocket_money, name)')
                .eq('user_id', profile.id)

            let total = 0
            const roleNames: string[] = []

            for (const ur of (userRoles || [])) {
                const role = (ur as any).role
                if (!role) continue
                const sal = Number(role.salary_amount || 0)
                const pock = Number(role.pocket_money || 0)
                if (sal + pock > 0) {
                    total += sal + pock
                    roleNames.push(role.name)
                }
            }

            if (total <= 0) {
                results.push({ username: profile.username, amount: 0, status: 'skipped (no salary)' })
                continue
            }

            await admin
                .from('profiles')
                .update({ balance: Number(profile.balance) + total, last_salary: now.toISOString() })
                .eq('id', profile.id)

            await admin.from('transactions').insert([{
                from_user_id: null, to_user_id: profile.id,
                amount: total, type: 'salary',
                description: `Salaire hebdomadaire (${roleNames.join(', ')})`
            }])

            results.push({ username: profile.username, amount: total, status: 'paid' })
        }

        const paid = results.filter(r => r.status === 'paid').length
        const skipped = results.filter(r => r.status !== 'paid').length

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            paid,
            skipped,
            results,
        })
    } catch (err: any) {
        console.error('Salary cron error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
