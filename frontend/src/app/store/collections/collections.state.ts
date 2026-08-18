import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { DATA_COLLECTIONS, DataCollection } from '../../core/interfaces/data.interface';
import { RecordRow } from '../../core/services/data/api-map';

export type CollectionStatus = 'idle' | 'loading' | 'saving' | 'loaded' | 'error';

export interface CollectionSlice extends EntityState<RecordRow> {
  status: CollectionStatus;
  error: string | null;
}

export interface CollectionsState {
  version: number;
  records: Record<DataCollection, CollectionSlice>;
}

export const collectionAdapter = createEntityAdapter<RecordRow>({
  selectId: (row) => String(row['id'] ?? ''),
});

export function emptyCollectionSlice(): CollectionSlice {
  return collectionAdapter.getInitialState({
    status: 'idle',
    error: null,
  });
}

export function initialCollectionsState(): CollectionsState {
  return {
    version: 0,
    records: Object.fromEntries(DATA_COLLECTIONS.map((name) => [name, emptyCollectionSlice()])) as Record<
      DataCollection,
      CollectionSlice
    >,
  };
}

export const collectionEntitySelectors = collectionAdapter.getSelectors();
