alter table public.habitos
  add column if not exists texto_apoio_html text,
  add column if not exists youtube_url text;

comment on column public.habitos.texto_apoio_html is 'Conteúdo rico opcional para orientar a execução da ação de batalha.';
comment on column public.habitos.youtube_url is 'URL opcional de vídeo do YouTube para apoio da ação de batalha.';

create index if not exists habitos_apoio_youtube_idx
  on public.habitos (user_id)
  where youtube_url is not null;
