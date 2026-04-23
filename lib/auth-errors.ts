/**
 * Vertaal Supabase Auth foutmeldingen naar Nederlands.
 * Supabase geeft altijd Engelse foutmeldingen terug - deze functie
 * mapt de bekende meldingen naar gebruiksvriendelijk Nederlands.
 */
export function translateAuthError(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes('error sending confirmation email') || msg.includes('sending confirmation')) {
    return 'Er kon geen bevestigingsmail worden verstuurd. Controleer je e-mailadres en probeer het opnieuw.';
  }
  if (msg.includes('already registered') || msg.includes('already in use') || msg.includes('user already registered')) {
    return 'Dit e-mailadres is al in gebruik. Log in via de inlogpagina.';
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return 'Vul een geldig e-mailadres in.';
  }
  if (msg.includes('password should be at least') || msg.includes('password must be')) {
    return 'Je wachtwoord moet minimaal 6 tekens bevatten.';
  }
  if (msg.includes('email rate limit') || msg.includes('rate limit exceeded') || msg.includes('too many requests')) {
    return 'Te veel pogingen. Wacht even en probeer het opnieuw.';
  }
  if (msg.includes('for security purposes') || msg.includes('after') && msg.includes('seconds')) {
    return 'Wacht even voordat je het opnieuw probeert.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Ongeldig e-mailadres of wachtwoord.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Je e-mailadres is nog niet bevestigd. Controleer je inbox.';
  }
  if (msg.includes('signup disabled') || msg.includes('signups not allowed')) {
    return 'Registreren is momenteel niet mogelijk. Probeer het later opnieuw.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Geen verbinding. Controleer je internetverbinding en probeer het opnieuw.';
  }

  // Fallback: geen ruwe Engelse melding tonen
  return 'Er is een fout opgetreden. Probeer het opnieuw.';
}
