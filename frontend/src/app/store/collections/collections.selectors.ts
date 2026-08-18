import { createSelector } from '@ngrx/store';
import { DataCollection } from '../../core/interfaces/data.interface';
import { collectionEntitySelectors } from './collections.state';
import { collectionsFeature } from './collections.reducer';

export const selectCollectionSlice = (name: DataCollection) =>
  createSelector(collectionsFeature.selectRecords, (records) => records[name]);

export const selectCollectionItems = (name: DataCollection) =>
  createSelector(selectCollectionSlice(name), (slice) => collectionEntitySelectors.selectAll(slice));

export const selectCollectionStatus = (name: DataCollection) =>
  createSelector(selectCollectionSlice(name), (slice) => slice.status);

export const selectCollectionEntity = (name: DataCollection, id: string) =>
  createSelector(selectCollectionSlice(name), (slice) => slice.entities[id] ?? null);

export const selectCollectionsVersion = collectionsFeature.selectVersion;
