// utils.js (or any suitable file for utility functions)

export const removeHtmlTags = (htmlString) => {
  if (typeof htmlString !== "string") {
    return ""; // Return an empty string for non-string inputs
  }
  return htmlString.replace(/<\/?[^>]+(>|$)/g, "");
};
