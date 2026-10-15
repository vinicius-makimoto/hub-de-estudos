export type Curso = {
  id: string;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  carga_horaria?: number | string | null;
  total_materias?: number | null;
  imagem_url?: string | null;
  created_at?: string | null;
};

export type Materia = {
  id: string;
  curso_id: string;
  titulo: string;
  descricao: string | null;
  conteudo: string | null;
  publicado: boolean;
  criado_em: string;
};
