export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')                // Entfernt Akzente (falls z. B. französisch)
    .replace(/[\u0300-\u036f]/g, '') // Entfernt diakritische Zeichen
    .replace(/[^a-z0-9\s-]/g, '')    // Entfernt alle Sonderzeichen außer Bindestrich
    .trim()
    .replace(/\s+/g, '-');           // Leerzeichen → Bindestrich
}


export function deslugify(slug: string): string {
  return slug
    .replace(/ae/g, 'ä')
    .replace(/oe/g, 'ö')
    .replace(/ue/g, 'ü')
    .replace(/ss/g, 'ß')
    .replace(/-/g, ' ');
}