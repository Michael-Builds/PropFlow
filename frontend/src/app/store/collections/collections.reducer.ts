import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthActions } from '../auth/auth.actions';
import { CollectionsActions } from './collections.actions';
import {
  collectionAdapter,
  CollectionSlice,
  CollectionsState,
  initialCollectionsState,
} from './collections.state';
import { DataCollection } from '../../core/interfaces/data.interface';

const initialState = initialCollectionsState();

function patchSlice(
  state: CollectionsState,
  name: DataCollection,
  updater: (slice: CollectionSlice) => CollectionSlice,
  bumpVersion = false,
): CollectionsState {
  return {
    version: bumpVersion ? state.version + 1 : state.version,
    records: {
      ...state.records,
      [name]: updater(state.records[name]),
    },
  };
}

const collectionsReducer = createReducer(
  initialState,
  on(CollectionsActions.load, (state, { name }) =>
    patchSlice(state, name, (slice) => ({ ...slice, status: 'loading', error: null })),
  ),
  on(CollectionsActions.loadSuccess, (state, { name, rows }) =>
    patchSlice(
      state,
      name,
      (slice) => collectionAdapter.setAll(rows, { ...slice, status: 'loaded', error: null }),
      true,
    ),
  ),
  on(CollectionsActions.loadFailure, (state, { name, error }) =>
    patchSlice(state, name, (slice) => ({ ...slice, status: 'error', error })),
  ),
  on(CollectionsActions.loadOne, (state, { name }) =>
    patchSlice(state, name, (slice) => ({ ...slice, status: slice.status === 'loaded' ? slice.status : 'loading' })),
  ),
  on(CollectionsActions.loadOneSuccess, (state, { name, row }) =>
    patchSlice(state, name, (slice) => collectionAdapter.upsertOne(row, { ...slice, status: 'loaded', error: null }), true),
  ),
  on(CollectionsActions.loadOneFailure, (state, { name, error }) =>
    patchSlice(state, name, (slice) => ({ ...slice, status: 'error', error })),
  ),
  on(CollectionsActions.create, CollectionsActions.update, CollectionsActions.remove, (state, { name }) =>
    patchSlice(state, name, (slice) => ({ ...slice, status: 'saving', error: null })),
  ),
  on(CollectionsActions.createSuccess, (state, { name, row }) =>
    patchSlice(state, name, (slice) => collectionAdapter.addOne(row, { ...slice, status: 'loaded', error: null }), true),
  ),
  on(CollectionsActions.updateSuccess, (state, { name, row }) =>
    patchSlice(state, name, (slice) => collectionAdapter.upsertOne(row, { ...slice, status: 'loaded', error: null }), true),
  ),
  on(CollectionsActions.removeSuccess, (state, { name, ids }) =>
    patchSlice(state, name, (slice) => collectionAdapter.removeMany(ids, { ...slice, status: 'loaded', error: null }), true),
  ),
  on(
    CollectionsActions.createFailure,
    CollectionsActions.updateFailure,
    CollectionsActions.removeFailure,
    (state, { name, error }) => patchSlice(state, name, (slice) => ({ ...slice, status: 'error', error })),
  ),
  on(AuthActions.logoutSuccess, AuthActions.setActiveOrg, () => initialCollectionsState()),
  on(CollectionsActions.markNotificationRead, CollectionsActions.markNotificationReadSuccess, (state, { id }) =>
    patchSlice(
      state,
      'notifications',
      (slice) => {
        const current = slice.entities[id];
        if (!current) return slice;
        return collectionAdapter.upsertOne({ ...current, read: true }, slice);
      },
      true,
    ),
  ),
);

export const collectionsFeature = createFeature({
  name: 'collections',
  reducer: collectionsReducer,
});
