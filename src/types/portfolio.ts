export interface PortfolioItem {
  id: string
  title: string
  subtitle: string
  description: string
  category: 'rendering' | 'ai' | 'procedural' | 'xr' | 'tool' | 'game'
  semester: string
  date: string
  thumbnail: string
  mediaUrl?: string
  techStack: string[]
  aiContribution?: number
  performanceData?: Record<string, string | number>
  starDoc: {
    situation: string
    task: string
    action: string
    result: string
  }
  links: {
    github?: string
    demo?: string
    article?: string
  }
  tags: string[]
}

export interface PortfolioState {
  items: PortfolioItem[]
  selectedItem: PortfolioItem | null
  filter: {
    category: string | null
    semester: string | null
    search: string
  }
  loading: boolean
  error: string | null
}
