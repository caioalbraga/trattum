export function getGreeting(name: string): string {
  // Get current time in Brasília timezone (UTC-3)
  const now = new Date();
  const brasiliaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const hours = brasiliaTime.getHours();
  const minutes = brasiliaTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Convert time ranges to minutes for easier comparison
  const time0430 = 4 * 60 + 30;  // 04:30 = 270 minutes
  const time1200 = 12 * 60;       // 12:00 = 720 minutes
  const time1800 = 18 * 60;       // 18:00 = 1080 minutes
  const time0100 = 1 * 60;        // 01:00 = 60 minutes

  if (totalMinutes >= time0430 && totalMinutes < time1200) {
    return `Bom dia, ${name}!`;
  } else if (totalMinutes >= time1200 && totalMinutes < time1800) {
    return `Boa tarde, ${name}!`;
  } else if (totalMinutes >= time1800 || totalMinutes <= time0100) {
    return `Boa noite, ${name}!`;
  } else {
    // 01:01 - 04:29
    return `Você por aqui essas horas, ${name}?`;
  }
}
