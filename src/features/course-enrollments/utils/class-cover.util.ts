// General-purpose covers; add files here to widen the rotation.
const CLASS_COVERS = ["/images/subjects/score.webp", "/images/subjects/ensemble.webp", "/images/subjects/piano.webp"] as const;

// The same course always gets the same cover, without inferring anything from its name.
export function getClassCover(seed: string): string {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return CLASS_COVERS[hash % CLASS_COVERS.length];
}
