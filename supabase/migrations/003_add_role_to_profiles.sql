-- --------------------------------------------------------
-- Migratie 003: role-kolom aan profiles toevoegen
-- --------------------------------------------------------
-- Voegt een 'role' kolom toe aan de profiles-tabel.
-- Standaardwaarde is 'user'. Admins krijgen role='admin'.
-- De admin-check in de applicatie gebruikt deze kolom,
-- zodat er geen e-mailadressen hardcoded hoeven te staan.
-- --------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Index zodat de role-lookup snel gaat
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Commentaar voor duidelijkheid in de database
COMMENT ON COLUMN public.profiles.role IS
  'Gebruikersrol: ''user'' (standaard) of ''admin'' (beheerderstoegang tot Control Tower).';
