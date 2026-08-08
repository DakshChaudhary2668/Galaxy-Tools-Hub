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

  async findBySlug(slug: string): Promise<T | null> {
    const { data, error } = await supabaseAdmin.from(this.tableName).select('*').eq('slug', slug).single();
    if (error) return null;
    return data as T;
  }

  async findOneByField(field: string, value: unknown): Promise<T | null> {
    const { data, error } = await supabaseAdmin.from(this.tableName).select('*').eq(field, value).single();
    if (error) return null;
    return data as T;
  }

  async list(limit = 20): Promise<T[]> {
    const { data, error } = await supabaseAdmin.from(this.tableName).select('*').limit(limit);
    if (error) throw new Error(error.message);
    return data as T[];
  }

  async create(payload: Partial<T>): Promise<T> {
    const { data, error } = await supabaseAdmin.from(this.tableName).insert(payload as any).select().single();
    if (error) throw new Error(error.message);
    return data as T;
  }

  async update(id: string, payload: Partial<T>): Promise<T> {
    const { data, error } = await supabaseAdmin.from(this.tableName).update(payload as any).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as T;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin.from(this.tableName).delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
}
