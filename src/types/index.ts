export interface Project {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  name: string
  description: string | null
  status: 'active' | 'completed' | 'on_hold' | 'cancelled'
  client_name: string | null
  client_id: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
}

export type ProjectFormData = {
  name: string
  description: string
  status: Project['status']
  client_name: string
  start_date: string
  end_date: string
  budget: string
}
