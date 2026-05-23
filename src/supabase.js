import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://rpwwvospxaefisiuppoo.supabase.co"
const SUPABASE_KEY = "sb_publishable_5PTxJzrqd4H5AJ2-VFTIgg_qZxKKvVI"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)