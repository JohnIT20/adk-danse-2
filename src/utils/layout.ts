// Lay out time-based events so overlapping ones split the column width
// horizontally instead of stacking on top of each other.

export interface TimeSlot {
  startTime: string; // HH:MM
  endTime: string;
}

export interface PositionedSlot<T> {
  item: T;
  column: number;   // 0-based index within the cluster
  columns: number;  // total tracks the cluster needs
}

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Groups events into "overlap clusters" (transitive overlap) and assigns
 * each event a column index within its cluster, using a greedy first-fit
 * algorithm. Use the returned `column`/`columns` to compute CSS left/width:
 *   left  = (column / columns) * 100%
 *   width = (1 / columns) * 100%
 */
export function layoutTimeSlots<T extends TimeSlot>(items: T[]): PositionedSlot<T>[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) =>
    toMinutes(a.startTime) - toMinutes(b.startTime) ||
    toMinutes(a.endTime) - toMinutes(b.endTime)
  );

  type Annotated = { item: T; column: number; cluster: number };
  const annotated: Annotated[] = [];
  const clusters: number[][] = []; // each cluster = array of latest end times per track
  let currentCluster = -1;
  let clusterEnd = -Infinity;

  for (const item of sorted) {
    const start = toMinutes(item.startTime);
    const end = toMinutes(item.endTime);

    if (start >= clusterEnd) {
      currentCluster++;
      clusters[currentCluster] = [];
      clusterEnd = end;
    } else {
      clusterEnd = Math.max(clusterEnd, end);
    }

    const tracks = clusters[currentCluster];
    let column = tracks.findIndex(trackEnd => trackEnd <= start);
    if (column === -1) {
      tracks.push(end);
      column = tracks.length - 1;
    } else {
      tracks[column] = end;
    }

    annotated.push({ item, column, cluster: currentCluster });
  }

  const clusterTracks = clusters.map(c => c.length);

  return annotated.map(a => ({
    item: a.item,
    column: a.column,
    columns: clusterTracks[a.cluster],
  }));
}
