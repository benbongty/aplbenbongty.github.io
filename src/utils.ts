export const getDifficultyColor = (difficulty: number | null): string => {
  if (difficulty === null || difficulty === undefined) return 'Unrated';
  if (difficulty < 400) return 'Gray';
  if (difficulty < 800) return 'Brown';
  if (difficulty < 1200) return 'Green';
  if (difficulty < 1600) return 'Cyan';
  if (difficulty < 2000) return 'Blue';
  if (difficulty < 2400) return 'Yellow';
  if (difficulty < 2800) return 'Orange';
  return 'Red';
};

export const getDifficultyColorHex = (difficulty: number | null): string => {
  if (difficulty === null || difficulty === undefined) return '#1e1e1e'; // unrated
  if (difficulty < 400) return '#808080';
  if (difficulty < 800) return '#804000';
  if (difficulty < 1200) return '#008000';
  if (difficulty < 1600) return '#00C0C0';
  if (difficulty < 2000) return '#0000FF';
  if (difficulty < 2400) return '#C0C000';
  if (difficulty < 2800) return '#FF8000';
  return '#FF0000';
};

export const getDifficultyColorClass = (color: string): string => {
  switch (color) {
    case 'Gray': return 'text-gray-500';
    case 'Brown': return 'text-[#804000]';
    case 'Green': return 'text-green-600';
    case 'Cyan': return 'text-cyan-500';
    case 'Blue': return 'text-blue-600';
    case 'Yellow': return 'text-yellow-500';
    case 'Orange': return 'text-orange-500';
    case 'Red': return 'text-red-600';
    default: return 'text-gray-900 dark:text-gray-100';
  }
};

export const getDifficultyBgClass = (color: string): string => {
  switch (color) {
    case 'Gray': return 'bg-gray-500';
    case 'Brown': return 'bg-[#804000]';
    case 'Green': return 'bg-green-600';
    case 'Cyan': return 'bg-cyan-500';
    case 'Blue': return 'bg-blue-600';
    case 'Yellow': return 'bg-yellow-500';
    case 'Orange': return 'bg-orange-500';
    case 'Red': return 'bg-red-600';
    default: return 'bg-gray-900 dark:bg-gray-100';
  }
};

export const getHexByColorName = (color: string): string => {
  switch (color) {
    case 'Gray': return '#808080';
    case 'Brown': return '#804000';
    case 'Green': return '#008000';
    case 'Cyan': return '#00C0C0';
    case 'Blue': return '#0000FF';
    case 'Yellow': return '#C0C000';
    case 'Orange': return '#FF8000';
    case 'Red': return '#FF0000';
    case 'Unrated': return '#1e1e1e';
    default: return '#1e1e1e';
  }
};
