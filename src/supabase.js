import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://rpwwvospxaefisiuppoo.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd3d2b3NweGFlZmlzaXVwcG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNDA0NjEsImV4cCI6MjA5NDcxNjQ2MX0.1nOUuIJWgDGomYVP_IahzY2NV3fHfO8HiFbftoR6LG0"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)