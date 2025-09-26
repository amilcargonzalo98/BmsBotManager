export const truncateText = (value, maxLength = 65) => {
  if (value === null || value === undefined) {
    return '';
  }

  const str = typeof value === 'string' ? value : String(value);
  if (str.length <= maxLength) {
    return str;
  }

  return `${str.slice(0, maxLength)}...`;
};
