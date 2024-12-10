export const formattedDateTime = (date: Date, tz: string) => {
  const baseOption: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }
  try {
    // hard coding to CA since better for string comparison
    return new Intl.DateTimeFormat("en-CA", { ...baseOption, timeZone: tz }).format(date)
  } catch (e) {
    console.warn("Error, falling back to UTC timezone")
    // hard coding to CA since better for string comparison
    return new Intl.DateTimeFormat("en-CA", { ...baseOption, timeZone: 'UTC' }).format(date)
  }
}
