import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";

export default async function TesteSupabase() {
  await connection();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cursos")
    .select("id, titulo")
    .limit(10);

  if (error) {
    return <p>Erro: {error.message}</p>;
  }

  return (
    <main>
      <h1>Conexão com Supabase</h1>
      <p>Consulta realizada com sucesso!</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}
