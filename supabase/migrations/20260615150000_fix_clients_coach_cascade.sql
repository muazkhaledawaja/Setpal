-- Fix: clients.coach_id used ON DELETE RESTRICT which blocks deleting a coach
-- who still has clients. Change to CASCADE so deleting a coach also removes
-- their client relationships (profiles rows persist via a separate FK).

alter table public.clients
  drop constraint clients_coach_id_fkey,
  add constraint clients_coach_id_fkey
    foreign key (coach_id)
    references public.coaches(id)
    on delete cascade;
