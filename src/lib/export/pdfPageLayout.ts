/** Vertical positions (mm) for placing a tall image across A4 pages in jsPDF. */
export function computePdfImageYPositions(
  imageHeightMm: number,
  pageHeightMm: number,
  marginMm: number
): number[] {
  const pageContentHeight = pageHeightMm - marginMm * 2;

  if (imageHeightMm <= pageContentHeight) {
    return [marginMm];
  }

  const positions: number[] = [marginMm];
  let heightLeft = imageHeightMm - pageContentHeight;

  while (heightLeft > 0) {
    positions.push(marginMm - (imageHeightMm - heightLeft));
    heightLeft -= pageContentHeight;
  }

  return positions;
}
