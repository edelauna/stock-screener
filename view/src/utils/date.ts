export const formattedDateNow = (tz: string) => formattedDate(new Date(), tz)

export const formattedDate = (date: Date, tz: string): string => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: tz
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);

    // Format the date and extract parts
    const fp = formatter.formatToParts(date);

    return `${fp.find(p => p.type === 'year')?.value}-${fp.find(p => p.type === 'month')?.value}-${fp.find(p => p.type === 'day')?.value}`;

  } catch (e) {
    console.warn("Error, falling back to ISO time")
    return new Date().toISOString().split('T')[0]
  }
}
