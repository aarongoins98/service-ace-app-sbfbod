
/**
 * Formats a phone number string to (000)000-0000 format
 * @param value - The raw phone number input
 * @returns Formatted phone number string
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = cleaned.substring(0, 10);
  
  // Format based on length
  if (limited.length === 0) {
    return '';
  } else if (limited.length <= 3) {
    return `(${limited}`;
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 3)})${limited.slice(3)}`;
  } else {
    return `(${limited.slice(0, 3)})${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

/**
 * Extracts only the numeric digits from a formatted phone number
 * @param formatted - The formatted phone number string
 * @returns String containing only numeric digits
 */
export const getPhoneDigits = (formatted: string): string => {
  return formatted.replace(/\D/g, '');
};
