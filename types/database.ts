export type Role = 'patron' | 'gestionnaire' | 'cuisinier'
export type MouvementType = 'entree' | 'sortie'
export type DemandeStatut = 'en_attente' | 'approuvee' | 'rejetee' | 'livree'
export type PedidoStatut = 'brouillon' | 'enviada' | 'recibida' | 'cancelada'

export interface Database {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          nom: string
          created_at: string
        }
        Insert: {
          id?: string
          nom: string
          created_at?: string
        }
        Update: {
          id?: string
          nom?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          restaurant_id: string
          nom: string
          username: string | null
          role: string
          actif: boolean
          created_at: string
        }
        Insert: {
          id: string
          restaurant_id: string
          nom: string
          username?: string | null
          role: string
          actif?: boolean
          created_at?: string
        }
        Update: {
          restaurant_id?: string
          nom?: string
          username?: string | null
          role?: string
          actif?: boolean
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          restaurant_id: string
          nom: string
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          nom: string
          created_at?: string
        }
        Update: {
          nom?: string
        }
        Relationships: []
      }
      fournisseurs: {
        Row: {
          id: string
          restaurant_id: string
          nom: string
          contact: string | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          nom: string
          contact?: string | null
          created_at?: string
        }
        Update: {
          nom?: string
          contact?: string | null
        }
        Relationships: []
      }
      produits: {
        Row: {
          id: string
          restaurant_id: string
          categorie_id: string | null
          fournisseur_id: string | null
          nom: string
          presentation: string | null
          unite: string
          unite_achat: string | null
          factor_achat: number | null
          stock_actuel: number
          stock_minimum: number
          stock_maximum: number | null
          valeur_unitaire: number
          date_peremption: string | null
          actif: boolean
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          categorie_id?: string | null
          fournisseur_id?: string | null
          nom: string
          presentation?: string | null
          unite?: string
          unite_achat?: string | null
          factor_achat?: number | null
          stock_actuel?: number
          stock_minimum?: number
          stock_maximum?: number | null
          valeur_unitaire?: number
          date_peremption?: string | null
          actif?: boolean
          created_at?: string
        }
        Update: {
          categorie_id?: string | null
          fournisseur_id?: string | null
          nom?: string
          presentation?: string | null
          unite?: string
          unite_achat?: string | null
          factor_achat?: number | null
          stock_actuel?: number
          stock_minimum?: number
          stock_maximum?: number | null
          valeur_unitaire?: number
          date_peremption?: string | null
          actif?: boolean
        }
        Relationships: []
      }
      mouvements: {
        Row: {
          id: string
          restaurant_id: string
          produit_id: string
          user_id: string
          type: string
          quantite: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          produit_id: string
          user_id: string
          type: string
          quantite: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          quantite?: number
          notes?: string | null
        }
        Relationships: []
      }
      demandes: {
        Row: {
          id: string
          numero: number
          restaurant_id: string
          cuisinier_id: string
          note: string | null
          statut: string
          gestionnaire_id: string | null
          traite_at: string | null
          livre_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          numero?: number
          restaurant_id: string
          cuisinier_id: string
          note?: string | null
          statut?: string
          gestionnaire_id?: string | null
          traite_at?: string | null
          livre_at?: string | null
          created_at?: string
        }
        Update: {
          note?: string | null
          statut?: string
          gestionnaire_id?: string | null
          traite_at?: string | null
          livre_at?: string | null
        }
        Relationships: []
      }
      demande_lignes: {
        Row: {
          id: string
          demande_id: string
          produit_id: string
          quantite: number
          quantite_livree: number | null
          created_at: string
        }
        Insert: {
          id?: string
          demande_id: string
          produit_id: string
          quantite: number
          quantite_livree?: number | null
          created_at?: string
        }
        Update: {
          quantite?: number
          quantite_livree?: number | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          id: string
          numero: number
          restaurant_id: string
          fournisseur_id: string | null
          statut: string
          note: string | null
          created_by: string
          enviada_at: string | null
          recibida_at: string | null
          cancelada_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          numero?: number
          restaurant_id: string
          fournisseur_id?: string | null
          statut?: string
          note?: string | null
          created_by: string
          enviada_at?: string | null
          recibida_at?: string | null
          cancelada_at?: string | null
          created_at?: string
        }
        Update: {
          fournisseur_id?: string | null
          statut?: string
          note?: string | null
          enviada_at?: string | null
          recibida_at?: string | null
          cancelada_at?: string | null
        }
        Relationships: []
      }
      pedido_lineas: {
        Row: {
          id: string
          pedido_id: string
          produit_id: string
          cantidad_pedida: number
          cantidad_recibida: number
          precio_unitario: number
          unite_achat: string | null
          factor_achat: number | null
          created_at: string
        }
        Insert: {
          id?: string
          pedido_id: string
          produit_id: string
          cantidad_pedida: number
          cantidad_recibida?: number
          precio_unitario?: number
          unite_achat?: string | null
          factor_achat?: number | null
          created_at?: string
        }
        Update: {
          cantidad_pedida?: number
          cantidad_recibida?: number
          precio_unitario?: number
          unite_achat?: string | null
          factor_achat?: number | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_restaurant_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Types applicatifs (plus stricts que les types DB)
export type UserProfile = {
  id: string
  restaurant_id: string
  nom: string
  username: string | null
  role: Role
  actif: boolean
  created_at: string
}

export type Restaurant = Database['public']['Tables']['restaurants']['Row']
export type Categorie = Database['public']['Tables']['categories']['Row']
export type Fournisseur = Database['public']['Tables']['fournisseurs']['Row']
export type Produit = Database['public']['Tables']['produits']['Row']
export type Mouvement = Database['public']['Tables']['mouvements']['Row']
export type Demande = Database['public']['Tables']['demandes']['Row']
export type DemandeLigne = Database['public']['Tables']['demande_lignes']['Row']
export type Pedido = Database['public']['Tables']['pedidos']['Row']
export type PedidoLinea = Database['public']['Tables']['pedido_lineas']['Row']
