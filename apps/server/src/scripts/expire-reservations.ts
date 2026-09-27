import { supabaseAdmin } from '../config/supabase';

async function main(): Promise<void> {
  const { data, error } = await supabaseAdmin.rpc('expire_inventory_reservations');
  if (error) throw error;
  console.log(`Expired ${Number(data) || 0} inventory reservation(s).`);
}

main().catch((error) => {
  console.error('Failed to expire inventory reservations:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
