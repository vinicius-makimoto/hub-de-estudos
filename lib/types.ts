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
  professor?: string | null;
  total_aulas?: number | null;
  avaliacao?: string | null;
  bibliografia?: string | null;
};

export type Conceito = { titulo: string; descricao: string };
export type GlossarioItem = { termo: string; definicao: string };
export type Flashcard = { frente: string; verso: string };
export type QuizQuestion = {
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
};

export type Aula = {
  id: string;
  materia_id: string;
  titulo: string;
  descricao: string | null;
  conteudo: string | null;
  temas: string[];
  ordem: number;
  publicado: boolean;
  arquivo_path: string | null;
  criado_em: string;
  atualizado_em: string;
  conceitos?: Conceito[];
  glossario?: GlossarioItem[];
  pontos_prova?: string[];
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  planejada?: boolean;
  data_prevista?: string | null;
};

export type AulaMaterial = {
  id: string;
  aula_id: string;
  materia_id: string;
  nome: string;
  arquivo_path: string;
  tamanho_bytes: number | null;
  tipo_mime: string | null;
  status: "processando" | "indexado" | "erro";
  erro: string | null;
  total_trechos: number;
  criado_em: string;
  atualizado_em: string;
  indexado_em: string | null;
};
