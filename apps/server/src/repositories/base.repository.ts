import { supabaseAdmin } from '../config/supabase';

export class BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await supabaseAdmin.from(this.tableName).select('*').eq('id', id).single();
    if (error) return null;
    return data as T;
  }

  async list(limit = 20): Promise<T[]> {
    const { data, error } = await supabaseAdmin.from(this.tableName).select('*').limit(limit);
    if (error) throw new Error(error.message);
    return data as T[];
  }
}
