import postgres from 'postgres';

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const result = await sql`UPDATE services SET published = true WHERE published = false`;
  console.log('Updated rows:', result.count);
  await sql.end();
}

main().catch(console.error);
