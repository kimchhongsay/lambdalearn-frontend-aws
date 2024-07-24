// SortingOptions.js
export const SortingOptions = {
  DATE: "date",
  TITLE: "title",
  SUBJECT: "subject",
};

// Helper function to convert custom datetime format to ISO
const parseCustomDate = (datetime) => {
  // Replace underscores with 'T' and ensure proper format
  const isoDatetime = datetime
    .replace(/_/g, "T") // Change underscore to 'T'
    .replace(/-/g, ":") // Change hyphen to ':'
    .concat("Z"); // Append 'Z' for UTC timezone

  // Ensure correct format for Date parsing
  const formattedDate = isoDatetime.replace(
    /(\d{2}):(\d{2}):(\d{2})/,
    "$1-$2-$3"
  );

  console.log(`Formatted Date: ${formattedDate}`); // Debug log
  return new Date(formattedDate);
};

export const sortRecordings = (recordings, option, direction) => {
  return recordings.sort((a, b) => {
    let comparison = 0;
    if (option === SortingOptions.DATE) {
      const dateA = parseCustomDate(a.datetime).getTime();
      const dateB = parseCustomDate(b.datetime).getTime();
      console.log(`DateA: ${dateA}, DateB: ${dateB}`); // Debug log
      comparison = dateA - dateB;
    } else if (option === SortingOptions.TITLE) {
      comparison = a.title.localeCompare(b.title);
    } else if (option === SortingOptions.SUBJECT) {
      comparison = a.subject.localeCompare(b.subject);
    }

    console.log(`Comparison: ${comparison}, Direction: ${direction}`); // Debug log
    return direction === "asc" ? comparison : -comparison;
  });
};
