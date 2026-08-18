import { createActionGroup, props } from '@ngrx/store';
import { DataCollection } from '../../core/interfaces/data.interface';
import { RecordRow } from '../../core/services/data/api-map';

export const CollectionsActions = createActionGroup({
  source: 'Collections',
  events: {
    Load: props<{ name: DataCollection }>(),
    'Load Success': props<{ name: DataCollection; rows: RecordRow[] }>(),
    'Load Failure': props<{ name: DataCollection; error: string }>(),
    'Load One': props<{ name: DataCollection; id: string }>(),
    'Load One Success': props<{ name: DataCollection; row: RecordRow }>(),
    'Load One Failure': props<{ name: DataCollection; id: string; error: string }>(),
    Create: props<{ name: DataCollection; payload: RecordRow }>(),
    'Create Success': props<{ name: DataCollection; row: RecordRow }>(),
    'Create Failure': props<{ name: DataCollection; error: string }>(),
    Update: props<{ name: DataCollection; id: string; payload: RecordRow }>(),
    'Update Success': props<{ name: DataCollection; row: RecordRow }>(),
    'Update Failure': props<{ name: DataCollection; error: string }>(),
    Remove: props<{ name: DataCollection; ids: string[] }>(),
    'Remove Success': props<{ name: DataCollection; ids: string[] }>(),
    'Remove Failure': props<{ name: DataCollection; error: string }>(),
    'Mark Notification Read': props<{ id: string }>(),
    'Mark Notification Read Success': props<{ id: string }>(),
    'Prefetch Lookups': props<{ names: DataCollection[] }>(),
  },
});
